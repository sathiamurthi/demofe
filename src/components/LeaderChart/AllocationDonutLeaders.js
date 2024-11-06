// src/components/AllocationDonutChart/AllocationDonutChart.js
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import PropTypes from 'prop-types';

Chart.register(ArcElement, Tooltip, Legend);

const AllocationDonutChart = ({ allocated, unallocated, draft, bench }) => {
  const total = allocated + unallocated + draft + bench;
  const allocatedPercentage = total > 0 ? ((allocated / total) * 100).toFixed(1) : 0;

  const data = {
    labels: ['Allocated', 'Unallocated', 'Draft', 'Bench'],
    datasets: [
      {
        label: 'Employees',
        data: [allocated, unallocated, draft, bench],
        backgroundColor: [
          'rgba(75,192,192,1)',   // Allocated - Teal
          'rgba(255,99,132,1)',   // Unallocated - Red
          'rgba(255,206,86,1)',   // Draft - Yellow
          'rgba(153,102,255,1)',  // Bench - Purple
        ],
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
            const label = tooltipItem.label || '';
            const value = tooltipItem.raw || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${percentage}% (${value} Employees)`;
          },
        },
      },
    },
    cutout: '70%',
    maintainAspectRatio: false,
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>{allocatedPercentage}%</h2>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Allocated</p>
      </div>
    </div>
  );
};

// PropTypes for type checking
AllocationDonutChart.propTypes = {
  allocated: PropTypes.number.isRequired,
  unallocated: PropTypes.number.isRequired,
  draft: PropTypes.number.isRequired,
  bench: PropTypes.number.isRequired,
};

export default AllocationDonutChart;
