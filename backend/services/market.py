import random

def get_market_trends(skills):
    """
    Simulated Market Trends API
    In a real app, this would query a job board API or a pre-trained ML model.
    """
    trends = []
    for skill in skills:
        demand = random.randint(30, 95)
        trend = random.choice(['rising', 'stable', 'declining'])
        outlook = (
            f"High growth due to industry adoption." if trend == 'rising' else
            f"Steady demand across sectors." if trend == 'stable' else
            f"Market saturating; focus on niche specializations."
        )
        trends.append({
            "skill": skill,
            "demand": demand,
            "trend": trend,
            "outlook": outlook
        })
    
    summary = "Strong Market" if any(t['trend'] == 'rising' for t in trends) else "Stable Market"
    return {"trends": trends, "summary": summary}
