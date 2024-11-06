import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend);

const AllocationDonutChart = ({ total, dataValues, labels, colors }) => {
  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Employees',
        data: dataValues, // Dynamic data values
        backgroundColor: colors, // Use dynamic colors
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return tooltipItem.label + ': ' + tooltipItem.raw + ' Employees';
          },
        },
      },
    },
    cutout: '70%',
  };

  return (
    <div style={{ position: 'relative', width: '400px', margin: '0 auto' }}>
      <Doughnut data={data} options={options} />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 60, fontWeight: 'bold' }}>{total}</h2>
        <p style={{ margin: 0, fontSize: 26, fontWeight: 500 }}>Employees</p>
      </div>
    </div>
  );
};

export default AllocationDonutChart;