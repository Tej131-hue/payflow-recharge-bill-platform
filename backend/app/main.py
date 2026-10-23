from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
import os

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, String, Integer, Numeric, DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker, Session

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://payflow:payflow@localhost:5432/payflow",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[str] = mapped_column(String(30))
    provider: Mapped[str] = mapped_column(String(100))
    account: Mapped[str] = mapped_column(String(100))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(20))
    reference: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="PayFlow API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class PaymentType(str, Enum):
    recharge = "recharge"
    bill = "bill"

class PaymentRequest(BaseModel):
    type: PaymentType
    provider: str = Field(min_length=2, max_length=100)
    account: str = Field(min_length=3, max_length=100)
    amount: Decimal = Field(gt=0, le=100000)

class TransactionOut(BaseModel):
    id: int
    type: str
    provider: str
    account: str
    amount: Decimal
    status: str
    reference: str
    created_at: datetime

    class Config:
        from_attributes = True

@app.get("/health")
def health():
    return {"status": "ok", "service": "payflow-api"}

@app.post("/api/payments", response_model=TransactionOut)
def create_payment(payload: PaymentRequest, db: Session = Depends(get_db)):
    # Demo-only mock gateway: deterministic enough for testing without real money.
    status = "success" if int(payload.amount * 100) % 7 != 0 else "failed"
    reference = f"PF{int(datetime.utcnow().timestamp() * 1000)}"
    tx = Transaction(
        type=payload.type.value,
        provider=payload.provider,
        account=payload.account,
        amount=payload.amount,
        status=status,
        reference=reference,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

@app.get("/api/transactions", response_model=list[TransactionOut])
def list_transactions(
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Transaction).order_by(Transaction.created_at.desc())
    if status:
        query = query.filter(Transaction.status == status)
    return query.limit(100).all()

@app.get("/api/analytics")
def analytics(db: Session = Depends(get_db)):
    total = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(Transaction.status == "success").scalar()
    successful = db.query(func.count(Transaction.id)).filter(Transaction.status == "success").scalar()
    failed = db.query(func.count(Transaction.id)).filter(Transaction.status == "failed").scalar()
    total_count = successful + failed
    return {
        "total_spent": float(total or 0),
        "successful": successful,
        "failed": failed,
        "total_transactions": total_count,
        "success_rate": round((successful / total_count * 100), 1) if total_count else 0,
    }
