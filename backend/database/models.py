import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.database import Base

class BuildingModel(Base):
    __tablename__ = "buildings"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    rows = Column(Integer, default=20)
    columns = Column(Integer, default=20)
    grid_json = Column(Text, nullable=True)  # Full serialized grid layout
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    people = relationship("PersonModel", back_populates="building", cascade="all, delete-orphan")
    exits = relationship("ExitModel", back_populates="building", cascade="all, delete-orphan")
    fire_zones = relationship("FireZoneModel", back_populates="building", cascade="all, delete-orphan")

class PersonModel(Base):
    __tablename__ = "people"

    id = Column(String, primary_key=True, index=True)
    building_id = Column(String, ForeignKey("buildings.id"), nullable=False)
    label = Column(String, nullable=False)
    row = Column(Integer, nullable=False)
    column = Column(Integer, nullable=False)
    status = Column(String, default="WAITING")  # WAITING, EVACUATING, EVACUATED, TRAPPED

    building = relationship("BuildingModel", back_populates="people")

class ExitModel(Base):
    __tablename__ = "exits"

    id = Column(String, primary_key=True, index=True)
    building_id = Column(String, ForeignKey("buildings.id"), nullable=False)
    label = Column(String, nullable=False)
    row = Column(Integer, nullable=False)
    column = Column(Integer, nullable=False)
    capacity = Column(Integer, default=50)

    building = relationship("BuildingModel", back_populates="exits")

class FireZoneModel(Base):
    __tablename__ = "fire_zones"

    id = Column(String, primary_key=True, index=True)
    building_id = Column(String, ForeignKey("buildings.id"), nullable=False)
    row = Column(Integer, nullable=False)
    column = Column(Integer, nullable=False)
    active = Column(Boolean, default=True)
    severity = Column(Integer, default=1)

    building = relationship("BuildingModel", back_populates="fire_zones")
