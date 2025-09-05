"use client"
import Plot from 'react-plotly.js';

export type BubblePlotProps = {
    title: string;
    yLabel: string;
    xLabel: string;
    verticalLabels: string[];
    horizontalLabels: string[];
    values: number[][];
}

export default function BubblePlot(
  {
    title,
    yLabel,
    xLabel,
    verticalLabels,
    horizontalLabels,
    values
  }: BubblePlotProps
) {
  const xVals = horizontalLabels.map((_, i) => i);
  const yVals = verticalLabels.map((_, i) => i);
  const flatValues = values.flatMap(subvals => subvals.map(v => v))
  const maxVal = Math.max(...flatValues, 1);
  const markerSizes = flatValues.map(v => 20 * v / maxVal);
  const maxVerticalLabels = Math.max(...verticalLabels.map(l => l.length), 10);
  return (
    <Plot
      style={{maxWidth: "100%"}}
      data={[
        {
          x: values.flatMap(subvals => subvals.map((_, xi) => xi)),
          y: values.flatMap((subvals, yi) => subvals.map(() => yi)),
          mode: 'markers',
          marker: {
            size: markerSizes,
          }
        },
      ]}
      config={{responsive: true}}
      layout={{
        title: {
          text: title
        },
        xaxis: {
          title: {text: xLabel},
          tickvals: xVals,
          ticktext: horizontalLabels
        },
        yaxis: {
          title: {text: yLabel},
          tickvals: yVals,
          ticktext: verticalLabels
        },
        margin: {
          l: maxVerticalLabels * 7,
          r:50
        },
        showlegend: false,
      }}
    />
  )
}
