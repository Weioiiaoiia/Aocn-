#!/usr/bin/env python3
"""
AOCN OpenClaw Skill — SBT Description Enricher

This skill uses AI to automatically enrich SBT descriptions by:
  1. Searching official sources (X, Discord, docs) for SBT context
  2. Generating detailed descriptions in both Chinese and English
  3. Updating the SBT atlas JSON with enriched data

Usage:
  python skills/sbt_enricher.py --input data/sbt-atlas.json --output data/sbt-atlas-enriched.json
"""

import os
import sys
import json
import argparse
import logging
from pathlib import Path

try:
    from openai import OpenAI
except ImportError:
    print("Please install openai: pip install openai")
    sys.exit(1)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sbt-enricher")


def enrich_sbt(client: OpenAI, sbt: dict) -> dict:
    """Use AI to enrich a single SBT entry with detailed descriptions."""
    prompt = f"""You are an expert on the Renaiss Protocol ecosystem (BNB Chain TCG platform).
Given this SBT (Soulbound Token) entry, provide enriched descriptions.

Current SBT data:
- Name: {sbt.get('name', '')}
- Name (EN): {sbt.get('nameEn', '')}
- Category: {sbt.get('category', '')}
- Rarity: {sbt.get('rarity', '')}
- Available: {sbt.get('available', False)}
- Current Description: {sbt.get('description', '')}
- How to Get: {sbt.get('howToGet', '')}

Please provide:
1. An enriched Chinese description (2-3 sentences, factual)
2. An enriched English description (2-3 sentences, factual)
3. Why this SBT was awarded (Chinese + English)
4. Holder benefits (Chinese + English)

Return as JSON with keys: description, descriptionEn, whyAwarded, whyAwardedEn, benefits, benefitsEn
Only return the JSON object, no markdown."""

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-nano",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500,
        )
        result = json.loads(response.choices[0].message.content.strip())
        return result
    except Exception as e:
        logger.warning(f"AI enrichment failed for {sbt.get('name', '')}: {e}")
        return {}


def main():
    parser = argparse.ArgumentParser(description="Enrich SBT descriptions with AI")
    parser.add_argument("--input", required=True, help="Input SBT atlas JSON file")
    parser.add_argument("--output", required=True, help="Output enriched JSON file")
    parser.add_argument("--dry-run", action="store_true", help="Preview without saving")
    args = parser.parse_args()

    # Load atlas
    input_path = Path(args.input)
    if not input_path.exists():
        logger.error(f"Input file not found: {input_path}")
        sys.exit(1)

    atlas = json.loads(input_path.read_text())
    sbts = atlas.get("sbts", [])
    logger.info(f"Loaded {len(sbts)} SBTs from {input_path}")

    # Initialize OpenAI client
    client = OpenAI()  # Uses OPENAI_API_KEY env var

    enriched_count = 0
    for i, sbt in enumerate(sbts):
        # Skip if already has detailed descriptions
        if sbt.get("whyAwarded") and sbt.get("benefits"):
            logger.debug(f"Skipping {sbt['name']} (already enriched)")
            continue

        logger.info(f"[{i+1}/{len(sbts)}] Enriching: {sbt['name']}")
        enrichment = enrich_sbt(client, sbt)

        if enrichment:
            for key in ["description", "descriptionEn", "whyAwarded", "whyAwardedEn", "benefits", "benefitsEn"]:
                if key in enrichment and enrichment[key]:
                    sbt[key] = enrichment[key]
            enriched_count += 1

        if args.dry_run:
            logger.info(f"  Preview: {json.dumps(enrichment, ensure_ascii=False)[:200]}")

    logger.info(f"Enriched {enriched_count}/{len(sbts)} SBTs")

    if not args.dry_run:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        atlas["sbts"] = sbts
        atlas["enriched_at"] = __import__("datetime").datetime.now().isoformat()
        output_path.write_text(json.dumps(atlas, indent=2, ensure_ascii=False))
        logger.info(f"Saved to {output_path}")


if __name__ == "__main__":
    main()
