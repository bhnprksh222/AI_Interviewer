from sqlalchemy.orm import Session
from backend.models.round_scores import (
    SelfIntroductionScore,
    MCQRoundScore,
    TechnicalRoundScore,
)


def save_mcq_score(user_id: int, total_score: float, feedback: str, db: Session):
    score = MCQRoundScore(user_id=user_id, total_score=total_score, feedback=feedback)
    db.add(score)
    db.commit()
    db.refresh(score)
    print(f"✅ MCQ score saved: {score}")


def save_technical_score(
    user_id: int, comm: float, tech: float, conf: float, feedback: str, db: Session
):
    score = TechnicalRoundScore(
        user_id=user_id,
        communication_score=comm,
        technical_knowledge_score=tech,
        confidence_score=conf,
        feedback=feedback,
    )
    db.add(score)
    db.commit()
    db.refresh(score)
    print(f"✅ Technical round score saved: {score}")


def save_intro_score(
    user_id: int, comm: float, conf: float, prof: float, feedback: str, db: Session
):
    score = SelfIntroductionScore(
        user_id=user_id,
        communication_score=comm,
        confidence_score=conf,
        professionalism_score=prof,
        feedback=feedback,
    )
    db.add(score)
    db.commit()
    db.refresh(score)
    print(f"✅ Self-introduction score saved: {score}")


def get_self_intro_scores(user_id: int, db: Session):
    """
    Retrieve the last 3 self-introduction scores for the user.
    """
    try:
        scores = (
            db.query(SelfIntroductionScore)
            .filter(SelfIntroductionScore.user_id == user_id)
            .order_by(SelfIntroductionScore.created_at.desc())
            .limit(3)
            .all()
        )
        return [
            {
                "communication_score": score.communication_score,
                "confidence_score": score.confidence_score,
                "professionalism_score": score.professionalism_score,
                "feedback": score.feedback,
                "timestamp": score.created_at,
            }
            for score in scores
        ]
    except Exception as e:
        print(f"❌ Error retrieving self-introduction scores: {e}")
        return []


def get_mcq_scores(user_id: int, db: Session):
    """
    Retrieve the last 3 MCQ round scores for the user.
    """
    try:
        scores = (
            db.query(MCQRoundScore)
            .filter(MCQRoundScore.user_id == user_id)
            .order_by(MCQRoundScore.created_at.desc())
            .limit(3)
            .all()
        )
        return [
            {
                "score": score.total_score,
                "feedback": score.feedback,
                "timestamp": score.created_at,
            }
            for score in scores
        ]
    except Exception as e:
        print(f"❌ Error retrieving MCQ scores: {e}")
        return []


def get_technical_scores(user_id: int, db: Session):
    """
    Retrieve the last 3 technical round scores for the user.
    """
    try:
        scores = (
            db.query(TechnicalRoundScore)
            .filter(TechnicalRoundScore.user_id == user_id)
            .order_by(TechnicalRoundScore.created_at.desc())
            .limit(3)
            .all()
        )
        return [
            {
                "communication_score": score.communication_score,
                "technical_knowledge_score": score.technical_knowledge_score,
                "confidence_score": score.confidence_score,
                "feedback": score.feedback,
                "timestamp": score.created_at,
            }
            for score in scores
        ]
    except Exception as e:
        print(f"❌ Error retrieving technical scores: {e}")
        return []
