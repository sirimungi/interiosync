"""
Seed the database with sample users, projects, quotes, and appointments.
Run from backend dir: python seed_data.py
"""
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from app.database import SessionLocal, Base
from app.config import DATABASE_URL
from app import models, crud, schemas


def seed():
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.User).first():
            print("Data already exists, skipping seed.")
            return

        # ── Users ─────────────────────────────────────────────────────────────
        designer = crud.create_user(db, schemas.UserCreate(
            name="Priya Sharma",
            email="designer@example.com",
            password="designer123",
            role="designer",
        ))
        client = crud.create_user(db, schemas.UserCreate(
            name="Rahul Mehta",
            email="client@example.com",
            password="client123",
            role="client",
        ))
        employee = crud.create_user(db, schemas.UserCreate(
            name="Arjun Nair",
            email="employee@example.com",
            password="employee123",
            role="employee",
        ))

        # ── Projects ──────────────────────────────────────────────────────────
        project1 = crud.create_project(db, schemas.ProjectCreate(
            name="3BHK Living Room Redesign",
            description="Modern living room with neutral tones, custom shelving, and Italian marble flooring.",
            designer_id=designer.id,
            client_id=client.id,
        ))
        project2 = crud.create_project(db, schemas.ProjectCreate(
            name="Kitchen Modular Refresh",
            description="New modular kitchen with soft-close shutters, backsplash, and under-counter lighting.",
            designer_id=designer.id,
            client_id=client.id,
        ))

        # ── Tasks ─────────────────────────────────────────────────────────────
        crud.create_task(db, schemas.TaskCreate(project_id=project1.id, title="Initial consultation", description="Discuss style, budget, and timeline", status="done"))
        crud.create_task(db, schemas.TaskCreate(project_id=project1.id, title="3D render", description="Create 3D render for client approval", status="in_progress"))
        crud.create_task(db, schemas.TaskCreate(project_id=project1.id, title="Marble procurement", description="Source Italian marble from vendor", status="todo"))
        crud.create_task(db, schemas.TaskCreate(project_id=project1.id, title="Final install", description="Furniture and décor installation", status="todo"))
        crud.create_task(db, schemas.TaskCreate(project_id=project2.id, title="Site measurement", description="Measure kitchen dimensions", status="done"))
        crud.create_task(db, schemas.TaskCreate(project_id=project2.id, title="Module design", description="Design modular layout", status="in_progress"))

        # ── Messages ──────────────────────────────────────────────────────────
        crud.create_message(db, schemas.MessageCreate(project_id=project1.id, content="Hi Rahul! Excited to start the living room project. I've got some great marble samples."), sender_id=designer.id)
        crud.create_message(db, schemas.MessageCreate(project_id=project1.id, content="Looking forward to it, Priya! Can we schedule a site visit this week?"), sender_id=client.id)
        crud.create_message(db, schemas.MessageCreate(project_id=project1.id, content="Of course! I've scheduled a site visit for Thursday 10 AM IST."), sender_id=designer.id)

        # ── Quotes ────────────────────────────────────────────────────────────
        # Draft quote for project 1
        quote1 = crud.create_quote(db, schemas.QuoteCreate(
            project_id=project1.id,
            title="Living Room Estimate — Phase 1",
            gst_rate=18,
            notes="Payment: 50% advance, 50% on completion. Valid for 30 days.",
            valid_until=datetime.utcnow() + timedelta(days=30),
        ), created_by=designer.id)

        crud.create_quote_item(db, quote1.id, schemas.QuoteLineItemCreate(
            description="Italian marble flooring",
            category="material",
            quantity=400,
            unit="sqft",
            unit_price=250,
            dimensions="10ft × 12ft (living) + 8ft × 10ft (dining)",
        ))
        crud.create_quote_item(db, quote1.id, schemas.QuoteLineItemCreate(
            description="Custom TV unit with backlit panel",
            category="furniture",
            quantity=1,
            unit="pcs",
            unit_price=45000,
            dimensions="7ft × 4ft",
        ))
        crud.create_quote_item(db, quote1.id, schemas.QuoteLineItemCreate(
            description="False ceiling with cove lighting",
            category="labour",
            quantity=300,
            unit="sqft",
            unit_price=120,
        ))
        crud.create_quote_item(db, quote1.id, schemas.QuoteLineItemCreate(
            description="Electrical points & switches (Anchor Roma)",
            category="electricals",
            quantity=12,
            unit="points",
            unit_price=1500,
        ))

        # Sent quote for project 2
        quote2 = crud.create_quote(db, schemas.QuoteCreate(
            project_id=project2.id,
            title="Modular Kitchen Estimate",
            gst_rate=18,
            notes="Includes soft-close shutters, under-counter LED, and backsplash.",
            valid_until=datetime.utcnow() + timedelta(days=15),
        ), created_by=designer.id)

        crud.create_quote_item(db, quote2.id, schemas.QuoteLineItemCreate(
            description="Modular kitchen base units (PVC board)",
            category="furniture",
            quantity=8,
            unit="modules",
            unit_price=8500,
        ))
        crud.create_quote_item(db, quote2.id, schemas.QuoteLineItemCreate(
            description="Wall units with soft-close hinges",
            category="furniture",
            quantity=5,
            unit="modules",
            unit_price=7200,
        ))
        crud.create_quote_item(db, quote2.id, schemas.QuoteLineItemCreate(
            description="Glass mosaic backsplash",
            category="material",
            quantity=40,
            unit="sqft",
            unit_price=350,
        ))
        crud.create_quote_item(db, quote2.id, schemas.QuoteLineItemCreate(
            description="Labour — installation & finishing",
            category="labour",
            quantity=1,
            unit="lot",
            unit_price=18000,
        ))

        # Mark quote2 as sent
        crud.update_quote(db, quote2.id, schemas.QuoteUpdate(status="sent"))

        # ── Appointments ──────────────────────────────────────────────────────
        crud.create_appointment(db, schemas.AppointmentCreate(
            type="site_visit",
            scheduled_at=datetime.utcnow() + timedelta(days=2, hours=4, minutes=30),  # ~10 AM IST
            duration_minutes=60,
            project_id=project1.id,
            assigned_to=client.id,
            notes="Bring marble samples and fabric swatches.",
        ), created_by=designer.id)

        crud.create_appointment(db, schemas.AppointmentCreate(
            type="quotation_meeting",
            scheduled_at=datetime.utcnow() + timedelta(days=5, hours=5),  # ~10:30 AM IST
            duration_minutes=45,
            project_id=project2.id,
            assigned_to=client.id,
            notes="Walk through the kitchen estimate and discuss material options.",
        ), created_by=designer.id)

        print("=" * 60)
        print("INTERIOSYNC seed complete!")
        print()
        print("Login credentials:")
        print("  Designer : designer@example.com / designer123")
        print("  Client   : client@example.com   / client123")
        print("  Employee : employee@example.com  / employee123")
        print()
        print("Sample data:")
        print("  2 projects, 6 tasks, 3 messages")
        print("  2 quotes (1 draft with 4 items, 1 sent with 4 items)")
        print("  2 upcoming appointments (IST)")
        print("=" * 60)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
