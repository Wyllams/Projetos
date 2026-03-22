"""
test_qualifier.py — Teste rápido do bravo-qualifier

Envia um lead fictício para o GPT-4o qualificar e insere no Supabase.
"""

import asyncio
import os
import sys

# Adicionar diretório pai ao path
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from qualifier import qualify_lead
from supabase_client import insert_qualified_lead


async def test():
    print("=" * 60)
    print("🧪 TESTE — Bravo Qualifier")
    print("=" * 60)

    # Lead fictício em inglês (simulando post do Reddit)
    test_lead = {
        "lead_id": "test-001",
        "fonte": "reddit",
        "grupo_ou_pagina": "r/HomeImprovement",
        "texto_original": "Hey everyone, I'm looking for a reliable contractor for a kitchen remodel in Milton GA. We're hoping to get started this month. Budget is around $45,000. Anyone have recommendations?",
        "nome_autor": "TestUser",
        "post_url": "https://reddit.com/r/HomeImprovement/test",
        "data_post": "2026-03-21T10:00:00",
        "servico_detectado": "Kitchen Remodel",
        "cidade_detectada": "Milton, GA",
        "urgencia_detectada": "alta",
        "score": 85.0,
        "tipo": "pedido_de_contractor",
    }

    # 1. Qualificar com GPT-4o
    print("\n📡 Enviando para GPT-4o...")
    qualification = await qualify_lead(test_lead)

    if not qualification:
        print("❌ FALHA: GPT-4o não retornou qualificação")
        return

    print(f"\n{'='*60}")
    print(f"📋 RESULTADO DA QUALIFICAÇÃO:")
    print(f"   Classificação: {qualification.get('classificacao', '?').upper()}")
    print(f"   Serviço: {qualification.get('service_type')}")
    print(f"   Cidade: {qualification.get('city')}")
    print(f"   Budget: ${qualification.get('estimated_budget', 0):,}")
    print(f"   Urgência: {qualification.get('urgency')}")
    print(f"   Idioma original: {qualification.get('original_language')}")
    print(f"   Confiança: {qualification.get('confidence')}%")
    print(f"\n   📝 Resumo (PT-BR):")
    print(f"   {qualification.get('summary')}")
    print(f"\n   💡 Ação recomendada:")
    print(f"   {qualification.get('recommended_action')}")
    print(f"{'='*60}")

    # 2. Inserir no Supabase
    print("\n📦 Inserindo na plataforma Bravo (Supabase)...")
    client_id, lead_id = await insert_qualified_lead(qualification)

    if lead_id:
        print(f"\n🎉 SUCESSO! Lead inserido na plataforma!")
        print(f"   Client ID: {client_id}")
        print(f"   Lead ID: {lead_id}")
        print(f"   → Verifique no Admin Dashboard!")
    else:
        print("\n⚠️ Falha ao inserir no Supabase")


if __name__ == "__main__":
    asyncio.run(test())
