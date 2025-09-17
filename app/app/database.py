from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import scoped_session, sessionmaker, relationship
from sqlalchemy import create_engine
import os


Base = automap_base()
engine = create_engine(
    os.getenv("APP_DATABASE_CONFIG", "sqlite:////home/bacmet/data/database.db")
)
db_session = scoped_session(
    sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )
)
Base.prepare(autoload_with=engine)


Validated = Base.classes.validated
ValidatedPDB = Base.classes.validated_pdb
Compounds = Base.classes.compounds
ValidatedCompounds = Base.classes.validated_compounds
PredictedUniqueHomologues = Base.classes.predicted_unique_homologues
Sequences = Base.classes.sequences
PredictedGroups = Base.classes.predicted_groups
SensitivityDistributions = Base.classes.sensitivity_distributions

Validated.compounds = relationship(
    'compounds',
    secondary=ValidatedCompounds.__table__,
    backref='validated',
    viewonly=True
)

PredictedUniqueHomologues.group = relationship(
    'predicted_groups',
    viewonly=True,
    uselist=False
)

PredictedUniqueHomologues.validated = relationship(
    'validated',
    viewonly=True,
    uselist=False
)

PredictedGroups.sequence = relationship(
    'sequences',
    viewonly=True,
    uselist=False
)
