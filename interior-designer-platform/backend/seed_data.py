"""
Seed the database with sample users and projects.
Run from backend dir: python seed_data.py
Requires DATABASE_URL (default: postgresql://postgres:password@localhost:5432/interior)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from app.database import SessionLocal, Base
from app.config import DATABASE_URL
from app import models, crud, schemas


def seed():
    connect_args = {}
    if DATABASE_URL.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.User).first():
            print("Data already exists, skipping seed.")
            return
        designer = crud.create_user(db, schemas.UserCreate(
            name="Alex Designer",
            email="designer@example.com",
            password="designer123",
            role="designer",
        ))
        client = crud.create_user(db, schemas.UserCreate(
            name="Jordan Client",
            email="client@example.com",
            password="client123",
            role="client",
        ))
        employee = crud.create_user(db, schemas.UserCreate(
            name="Sam Employee",
            email="employee@example.com",
            password="employee123",
            role="employee",
        ))
        project = crud.create_project(db, schemas.ProjectCreate(
            name="Living Room Redesign",
            description="Modern living room with neutral tones and custom shelving.",
            designer_id=designer.id,
            client_id=client.id,
        ))
        crud.create_task(db, schemas.TaskCreate(project_id=project.id, title="Initial consultation", description="Discuss style and budget", status="done"))
        crud.create_task(db, schemas.TaskCreate(project_id=project.id, title="3D mockup", description="Create 3D render", status="in_progress"))
        crud.create_task(db, schemas.TaskCreate(project_id=project.id, title="Final install", description="Furniture and decor install", status="todo"))
        crud.create_project(db, schemas.ProjectCreate(
            name="Kitchen Refresh",
            description="New backsplash and cabinet hardware.",
            designer_id=designer.id,
            client_id=client.id,
        ))
        crud.create_message(db, schemas.MessageCreate(project_id=project.id, content="Hi! Excited to get started on the living room."), sender_id=designer.id)
        crud.create_message(db, schemas.MessageCreate(project_id=project.id, content="Same here! When can we see the first mockup?"), sender_id=client.id)
        print("Seed complete. Users: designer@example.com / designer123, client@example.com / client123, employee@example.com / employee123")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
