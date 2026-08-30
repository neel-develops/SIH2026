import os
import json
import httpx

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "openai/gpt-oss-120b"
FAST_MODEL = "openai/gpt-oss-20b"

SECTIONS = ["CSTM-KYN", "KYN-KJT", "KJT-IGP", "IGP-LNL", "LNL-PUNE", "KYN-KSRA"]
DEPARTMENTS = {"ENG": "Engineering (track, rail, sleeper, ballast, bridge, turnout, formation, level crossing)",
               "S&T": "Signal & Telecom (signal, point machine, track circuit, axle counter, relay, OFC, SCADA, telephone)",
               "TD": "Traction Distribution (OHE, insulator, mast, contact wire, TSS, dropper, jumper, PSI, booster transformer)"}

DEFECT_TYPES = {
    "ENG": ["Rail Fracture", "Weld Joint Failure", "Gauge Deviation", "Ballast Deficiency",
            "Sleeper Failure", "Rail Wear", "Formation Defect", "Level Crossing Gate Defect",
            "Bridge Inspection", "Turnout Defect", "Track Circuit Bonding Defect", "Rail Joint Defect"],
    "S&T": ["Signal Lamp Failure", "Point Machine Failure", "Track Circuit Failure",
            "Axle Counter Failure", "Relay Room Equipment Fault", "OFC Cable Damage",
            "Level Crossing Gate Interlock", "Signal Post Damage", "SCADA Communication Failure",
            "Telephone Cable Fault", "IBS Equipment Failure"],
    "TD": ["OHE Wire Break", "Insulator Failure", "Mast Foundation Defect", "Contact Wire Wear",
           "TSS Equipment Fault", "Dropper Defect", "Jumper Connection Fault", "PSI Tripping",
           "Booster Transformer Fault", "Earth Leakage"],
}


def _headers():
    return {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }


async def _chat(messages: list, model: str = MODEL, temperature: float = 0.1, max_tokens: int = 1024) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(GROQ_URL, headers=_headers(), json={
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        })
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def extract_defect_from_text(text: str) -> dict:
    """Extract structured defect data from natural language (Hindi/English/Hinglish)."""
    system = f"""You are an Indian Railways defect extraction AI for the CSTM-PUNE corridor.
Extract structured defect information from field reports written in Hindi, English, or Hinglish.

Valid sections: {json.dumps(SECTIONS)}
Valid departments and their scope: {json.dumps(DEPARTMENTS)}
Valid defect types per department: {json.dumps(DEFECT_TYPES)}

Return ONLY valid JSON with these fields:
{{
  "section": "one of the valid sections",
  "km_from": number (kilometer post),
  "defect_type": "closest matching defect type from the valid list",
  "department": "ENG or S&T or TD",
  "criticality": "CRITICAL or HIGH or MEDIUM or LOW",
  "requires_tsr": true/false (true if speed restriction mentioned or safety-critical),
  "description": "clean English summary of the defect",
  "asset_type": "the asset affected (e.g. Rail, Point Machine, OHE Wire)",
  "estimated_duration_hrs": number (estimated repair time in hours)
}}

Determine criticality based on: safety impact, whether TSR is needed, traffic disruption potential.
CRITICAL = immediate safety risk or line block needed. HIGH = urgent but not immediate danger.
MEDIUM = needs attention within weeks. LOW = routine maintenance."""

    result = await _chat([
        {"role": "system", "content": system},
        {"role": "user", "content": text},
    ], model=MODEL, temperature=0.05, max_tokens=500)

    start = result.find("{")
    end = result.rfind("}") + 1
    if start >= 0 and end > start:
        return json.loads(result[start:end])
    raise ValueError(f"Could not parse JSON from LLM response: {result[:200]}")


async def generate_block_rationale(block_info: dict) -> str:
    """Generate human-readable AI rationale for a scheduled block."""
    system = """You are an Indian Railways AI planning assistant. Generate a concise 2-3 sentence
rationale explaining why this maintenance block was scheduled. Write for a Senior Railway Officer.
Be specific about safety priorities and optimization decisions. Use formal railway terminology."""

    prompt = f"""Block Details:
- Section: {block_info['section']}
- Department: {block_info['department']}
- Duration: {block_info['duration_hrs']}h
- Combined Block: {block_info.get('is_combined', False)}
- Combined Departments: {block_info.get('combined_departments', [])}
- Defects Addressed: {block_info.get('defect_count', 0)}
- Defect Types: {block_info.get('defect_types', [])}
- AI Confidence: {block_info.get('ai_confidence', 0.85):.0%}
- Window: {block_info.get('scheduled_start', '')} to {block_info.get('scheduled_end', '')}

Explain the scheduling rationale."""

    return await _chat([
        {"role": "system", "content": system},
        {"role": "user", "content": prompt},
    ], model=FAST_MODEL, temperature=0.3, max_tokens=200)


async def generate_executive_summary(kpi_data: dict, plan_data: dict = None) -> str:
    """Generate executive summary for DRM briefing."""
    system = """You are an AI assistant preparing executive briefing notes for the Divisional Railway Manager (DRM).
Write a formal 1-paragraph summary (4-6 sentences) covering: current asset health, optimization impact,
key risks, and recommended actions. Use specific numbers. Write in formal Indian Railways reporting style."""

    prompt = f"""Current KPI Data:
- Asset Availability Index (AAI): {kpi_data.get('aai_current', 0)}%
- Open Defects: {kpi_data.get('open_defects', 0)}
- Overdue Maintenance: {kpi_data.get('overdue_defects', 0)}
- Blocks Scheduled Today: {kpi_data.get('blocks_today', 0)}
- Block Utilization: {kpi_data.get('block_utilization', 0):.0%}
- Combined Block Rate: {kpi_data.get('combined_block_rate', 0):.0%}
- Pending Approvals: {kpi_data.get('pending_approvals', 0)}
- Department Breakdown: {kpi_data.get('department_breakdown', {})}"""

    if plan_data:
        prompt += f"""

Latest Plan:
- Tasks Scheduled: {plan_data.get('tasks_scheduled', 0)}
- Combined Blocks: {plan_data.get('combined_blocks', 0)}
- Solver Time: {plan_data.get('solver_time_ms', 0)}ms
- AAI Before: {plan_data.get('aai_before', 0)}% → After: {plan_data.get('aai_after', 0)}%
- Conflicts Resolved: {plan_data.get('conflicts_resolved', 0)}"""

    prompt += "\n\nGenerate the DRM briefing note."

    return await _chat([
        {"role": "system", "content": system},
        {"role": "user", "content": prompt},
    ], model=MODEL, temperature=0.4, max_tokens=400)


async def chat_assistant(question: str, context: dict) -> str:
    """Conversational AI assistant for railway officers."""
    system = f"""You are RailSync AI, the intelligent assistant for the AABPS (AI-Powered Automatic Block Planning System)
deployed on the CSTM-PUNE corridor, Central Railway, Mumbai Division.

You help railway officers with:
- Understanding defect priorities and scheduling decisions
- Explaining AI optimization results
- Answering questions about maintenance blocks, AAI metrics, and compliance
- Providing recommendations based on current data

Current System Context:
- AAI: {context.get('aai_current', 'N/A')}%
- Open Defects: {context.get('open_defects', 'N/A')}
- Overdue: {context.get('overdue_defects', 'N/A')}
- Blocks Today: {context.get('blocks_today', 'N/A')}
- Pending Approvals: {context.get('pending_approvals', 'N/A')}
- Department Breakdown: {context.get('department_breakdown', {})}
- Section Workload: {context.get('section_workload', [])}

Answer in clear, professional language. If asked in Hindi, respond in Hindi. Be concise (3-5 sentences max).
Reference specific data points from the context."""

    return await _chat([
        {"role": "system", "content": system},
        {"role": "user", "content": question},
    ], model=MODEL, temperature=0.5, max_tokens=500)


async def analyze_defect_trends(defect_stats: dict) -> str:
    """Analyze defect trends and provide recommendations."""
    system = """You are a railway maintenance analytics AI. Analyze the defect data and provide:
1. Key trend observation (1 sentence)
2. Highest risk area (1 sentence)
3. Recommended action (1 sentence)
Be specific with numbers and section names."""

    prompt = f"""Defect Statistics:
{json.dumps(defect_stats, indent=2)}

Analyze and provide insights."""

    return await _chat([
        {"role": "system", "content": system},
        {"role": "user", "content": prompt},
    ], model=FAST_MODEL, temperature=0.3, max_tokens=300)
