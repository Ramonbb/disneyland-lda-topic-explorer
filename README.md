# Interactive Topic Explorer

A static academic interface for exploring seven LDA topics derived from Disneyland visitor reviews. Topic 1 is selected when the explorer opens. Select a numbered circle by click, touch, Enter, or Space to view the corresponding description, thirty terms and three source excerpts.

## Source workbook and map

The workbook `tabla.xlsx` has one sheet, `disney tabla github`. The overview in A29:F36 uses the columns `Topic 1`, `Label`, `Description` and `Representative review excerpt 1` through `3`. The current term scores are in A1:C211 of `Sheet 1` in `top_relevance_terms_disney.xlsx`, with columns `topic`, `term` and `relevance`. The converter joins term rows to overview records by the exact topic label, keeps IDs 1–7 and sorts the 30 terms for each topic by decreasing relevance. The descriptions and 21 excerpts retain the workbook text. The axis label follows the workbook's `relevance` header. The formula and parameter settings used to compute the workbook scores are unspecified.

The reference in `assets/ldavis-reference.png` is the original image embedded in the workbook. The SVG uses approximate circle centres measured in screenshot pixels. Circle areas are proportional to the supplied prevalence percentages. Radii scale with the square root of prevalence, using the measured radius of 117 pixels for topic 1 (15.30%) as the reference. The map uses a fixed coordinate system, with the intersection of PC1 and PC2 at (598, 784) in image pixels. The original topic 3–6 overlap is visible and both centres are directly selectable.

## Topic indicators

`data/topic-indicators.json` stores indicator values by topic ID. Prevalence uses the supplied percentages and also determines the circle areas. Enter percentage-point numbers for `prevalence` and `thematicRepresentativeness`, and a decimal number for `coherence`. A `null` value displays as Unavailable. The workbook converter writes the separate `topics.json` dataset.

## Generate or update the dataset

Run these commands from this project directory with Python 3.10 or later. The workbooks may stay in the parent directory or at another local path.

```sh
python -m pip install -r requirements.txt
python scripts/excel_to_json.py ../tabla.xlsx ../top_relevance_terms_disney.xlsx
python -m http.server 8000
```

Open http://localhost:8000/ in a browser. The shipped JSON is already generated. Python is required only to regenerate the JSON or use this local server command. The browser loads D3 7.9.0 from jsDelivr and the JSON from the project. The converter validates all seven IDs, descriptions, review excerpts and thirty distinct numeric term scores per topic before writing the output.

When either workbook changes, rerun the converter, check the seven topics and commit the updated JSON. If the source map changes, update the reference image and remeasure the SVG geometry against it.

## Publish on GitHub Pages

1. Create a GitHub repository and push the contents of this project directory to the `main` branch. Ensure that `index.html` sits at the repository root.
2. In the repository settings, open **Pages**. Under **Build and deployment**, select **Deploy from a branch**, choose **main** and **/ (root)**, then save.
3. When the deployment completes, open the URL displayed in Pages settings and verify that the map, data and charts load. Subsequent pushes to the publishing branch update the site.

See the [GitHub Pages publishing guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and the [D3 browser setup guide](https://d3js.org/getting-started).
