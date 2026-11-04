"use strict";

// Centres and radii in screenshot pixels, measured from the embedded reference.
const geometry = [
  [531.5, 1026, 117], [437.5, 306, 115.5], [116, 756.5, 113.5],
  [348, 684.5, 113], [599.5, 1262, 112.3], [218, 916, 111],
  [1080, 652, 109.7]
];
const status = document.querySelector("#status");
const details = document.querySelector("#details");
const chart = document.querySelector("#chart");
let selected;

function drawChart(topic) {
  if (!window.d3) {
    chart.textContent = "The chart library could not be loaded.";
    return;
  }
  const width = Math.floor(chart.clientWidth);
  if (!width) return;
  chart.replaceChildren();
  const left = width < 360 ? 95 : 112;
  const right = width - 16;
  const top = 8;
  const bottom = 488;
  const height = 543;
  const x = d3.scaleLinear().domain([0, d3.max(topic.terms, d => d.value)]).nice()
    .range([left, right]);
  const y = d3.scaleBand().domain(topic.terms.map(d => d.term))
    .range([top, bottom]).padding(.24);
  const svg = d3.select(chart).append("svg").attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img").attr("aria-label", `Term relevance for ${topic.name}`);
  const ticks = width < 380 ? 4 : 6;
  svg.append("g").attr("class", "grid").attr("transform", `translate(0,${bottom})`)
    .call(d3.axisBottom(x).ticks(ticks).tickSize(top - bottom).tickFormat(() => ""));
  svg.selectAll(".bar").data(topic.terms).join("rect").attr("class", "bar")
    .attr("x", d => x(Math.min(0, d.value))).attr("y", d => y(d.term))
    .attr("height", y.bandwidth()).attr("width", d => Math.abs(x(d.value) - x(0)))
    .append("title").text(d => `${d.term} · Term relevance ${d.value}`);
  svg.append("g").attr("transform", `translate(${left},0)`).call(d3.axisLeft(y).tickSize(0))
    .call(g => g.select(".domain").remove());
  svg.append("g").attr("transform", `translate(0,${bottom})`).call(d3.axisBottom(x).ticks(ticks));
  svg.append("text").attr("x", (left + right) / 2).attr("y", height - 9)
    .attr("text-anchor", "middle").attr("fill", "#233e55").attr("font-size", 13)
    .text("Term relevance");
}

function showTopic(topic) {
  selected = topic;
  document.querySelectorAll(".topic").forEach(node => {
    node.setAttribute("aria-pressed", String(Number(node.dataset.id) === topic.id));
  });
  const title = `Topic ${topic.id}: ${topic.name}`;
  status.classList.add("visually-hidden");
  status.textContent = `${title} selected.`;
  document.querySelector("#topic-title").textContent = title;
  document.querySelector("#definition").textContent = topic.definition;
  const reviews = topic.reviews.map((review, index) => {
    const card = document.createElement("blockquote");
    card.className = "review";
    const label = document.createElement("strong");
    label.textContent = `Review ${index + 1}`;
    const text = document.createElement("p");
    text.textContent = review;
    card.append(label, text);
    return card;
  });
  document.querySelector("#reviews").replaceChildren(...reviews);
  details.hidden = false;
  drawChart(topic);
}

function svgElement(tag, attrs) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

async function start() {
  const response = await fetch("./data/topics.json");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const { topics } = await response.json();
  const nodes = document.querySelector("#nodes");
  for (const topic of topics) {
    const [cx, cy, r] = geometry[topic.id - 1];
    const group = svgElement("g", {
      class: "topic", role: "button", tabindex: 0, "aria-pressed": false,
      "data-id": topic.id, "aria-label": `Topic ${topic.id}: ${topic.name}`
    });
    const label = svgElement("text", { x: cx, y: cy, "aria-hidden": true });
    label.textContent = topic.id;
    group.append(svgElement("circle", { cx, cy, r }), label);
    group.addEventListener("click", () => showTopic(topic));
    group.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showTopic(topic);
      }
    });
    nodes.append(group);
  }
  let previousWidth;
  new ResizeObserver(([entry]) => {
    const width = entry.contentRect.width;
    if (selected && width && width !== previousWidth) drawChart(selected);
    previousWidth = width;
  }).observe(chart);
}

start().catch(error => {
  console.error(error);
  status.textContent = "Topic data could not be loaded. Open the explorer through an HTTP server.";
});
