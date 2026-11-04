"""Export the two source tables in tabla.xlsx as a static topic dataset."""
import argparse
import json
from math import isfinite
from pathlib import Path

import pandas as pd

SHEET = "disney tabla github"
REVIEWS = [f"Representative review excerpt {number}" for number in range(1, 4)]
OVERVIEW = ["Topic 1", "Label", "Description", *REVIEWS]
TERMS = ["topic", "term", "relevance"]


def table(sheet, headers):
    matches = [
        index for index, row in sheet.iterrows()
        if row.iloc[:len(headers)].tolist() == headers
    ]
    if len(matches) != 1:
        raise ValueError(f"Expected one header row with {headers}")
    records = []
    for row in sheet.iloc[matches[0] + 1:, :len(headers)].itertuples(index=False, name=None):
        if all(value == "" for value in row):
            break
        records.append(dict(zip(headers, row)))
    return records


def required_text(value, field):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Missing or invalid text in {field}")
    return value


def convert(source):
    sheet = pd.read_excel(source, sheet_name=SHEET, header=None, dtype=object,
                          keep_default_na=False, engine="openpyxl")
    topics = {}
    by_name = {}
    for row in table(sheet, OVERVIEW):
        topic_id = row["Topic 1"]
        if type(topic_id) is not int or topic_id not in range(1, 8) or topic_id in topics:
            raise ValueError(f"Invalid or duplicate topic identifier {topic_id!r}")
        name = required_text(row["Label"], "Label")
        if name in by_name:
            raise ValueError(f"Duplicate topic label {name!r}")
        topic = {
            "id": topic_id,
            "name": name,
            "definition": required_text(row["Description"], f"{name} description"),
            "reviews": [required_text(row[field], f"{name} {field}") for field in REVIEWS],
            "terms": [],
        }
        topics[topic_id] = by_name[name] = topic

    if set(topics) != set(range(1, 8)):
        raise ValueError("The overview must contain topic identifiers 1 through 7")

    for row in table(sheet, TERMS):
        name = row["topic"]
        if name not in by_name:
            raise ValueError(f"Term row refers to unknown topic label {name!r}")
        term = required_text(row["term"], f"{name} term")
        value = row["relevance"]
        if type(value) not in (int, float) or not isfinite(value):
            raise ValueError(f"Missing or invalid relevance for {name}, {term}")
        by_name[name]["terms"].append({"term": term, "value": value})

    for topic in topics.values():
        terms = topic["terms"]
        if len(terms) != 20 or len({entry["term"] for entry in terms}) != 20:
            raise ValueError(f"{topic['name']} must have 20 distinct terms")
        terms.sort(key=lambda entry: entry["value"], reverse=True)

    return {"metric": "relevance", "topics": [topics[i] for i in range(1, 8)]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path,
                        default=Path(__file__).resolve().parents[1] / "data" / "topics.json")
    args = parser.parse_args()
    try:
        data = convert(args.source)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False)
                               + "\n", encoding="utf-8")
    except (ValueError, OSError) as error:
        parser.exit(1, f"{error}\n")


if __name__ == "__main__":
    main()
