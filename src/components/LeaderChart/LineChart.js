// src/components/LineChart/LineChart.js
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Input, Button, ButtonGroup } from 'semantic-ui-react';
import { Chart, registerables } from 'chart.js';
import './LineChart.css';
import config from "../../Config.json";
import dayjs from 'dayjs';
import AllocationDonutChart from './AllocationDonutLeaders'; // Correct import path

// Register Chart.js components
Chart.register(...registerables);

const LineChartComponent = () => {
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: ''
    });
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });

    const [selectedRange, setSelectedRange] = useState('1m'); // Default to 1 month
    const [latestCounts, setLatestCounts] = useState({
        allocated: 0,
        unallocated: 0,
        draft: 0,
        bench: 0
    });

    // Function to calculate date ranges based on selected range
    const calculateDateRange = (range) => {
        const endDate = dayjs().format('YYYY-MM-DD');
        let startDate;

        switch (range) {
            case '1w':
                startDate = dayjs().subtract(1, 'week').format('YYYY-MM-DD');
                break;
            case '1m':
                startDate = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
                break;
            case '3m':
                startDate = dayjs().subtract(3, 'month').format('YYYY-MM-DD');
                break;
            case '6m':
                startDate = dayjs().subtract(6, 'month').format('YYYY-MM-DD');
                break;
            case '1y':
                startDate = dayjs().subtract(1, 'year').format('YYYY-MM-DD');
                break;
            case 'custom':
                startDate = formData.startDate;
                break;
            default:
                startDate = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
        }

        return { startDate, endDate };
    };

    // Function to fetch chart data for a specific range
    const fetchChartData = async (startDate, endDate) => {
        try {
            const response = await fetch(`${config.azureApiUrl}/api/employees/allocations?startDate=${startDate}&endDate=${endDate}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }
            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                console.warn("No data received from the API.");
                setChartData({
                    labels: [],
                    datasets: []
                });
                setLatestCounts({
                    allocated: 0,
                    unallocated: 0,
                    draft: 0,
                    bench: 0
                });
                return;
            }

            // Assuming data is ordered by date ascending
            const labels = data.map(item => item.date);
            const allocatedData = data.map(item => item.Allocated);
            const unallocatedData = data.map(item => item.Unallocated);
            const draftData = data.map(item => item.Draft);
            const benchData = data.map(item => item.Bench);

            setChartData({
                labels,
                datasets: [
                    {
                        label: 'Allocated',
                        data: allocatedData,
                        borderColor: 'rgba(75,192,192,1)',
                        backgroundColor: 'rgba(75,192,192,0.2)',
                        fill: true,
                        tension: 0.4,
                    },
                    {
                        label: 'Unallocated',
                        data: unallocatedData,
                        borderColor: 'rgba(255,99,132,1)',
                        backgroundColor: 'rgba(255,99,132,0.2)',
                        fill: true,
                        tension: 0.4,
                    },
                    {
                        label: 'Draft',
                        data: draftData,
                        borderColor: 'rgba(255,206,86,1)',
                        backgroundColor: 'rgba(255,206,86,0.2)',
                        fill: true,
                        tension: 0.4,
                    },
                    {
                        label: 'Bench',
                        data: benchData,
                        borderColor: 'rgba(153,102,255,1)',
                        backgroundColor: 'rgba(153,102,255,0.2)',
                        fill: true,
                        tension: 0.4,
                    },
                ],
            });

            // Set latest counts based on the latest date's data
            const latestIndex = data.length - 1;
            setLatestCounts({
                allocated: allocatedData[latestIndex] || 0,
                unallocated: unallocatedData[latestIndex] || 0,
                draft: draftData[latestIndex] || 0,
                bench: benchData[latestIndex] || 0
            });

        } catch (error) {
            console.error(`Error fetching data from specific date range API:`, error);
            setChartData({
                labels: [],
                datasets: []
            });
            setLatestCounts({
                allocated: 0,
                unallocated: 0,
                draft: 0,
                bench: 0
            });
        }
    };

    // Initialize default date range to 1 month
    useEffect(() => {
        const { startDate, endDate } = calculateDateRange(selectedRange);
        setFormData({ startDate, endDate });
        fetchChartData(startDate, endDate);
    }, []); // Runs once on mount

    // Fetch chart data when formData changes (custom range)
    useEffect(() => {
        if (formData.startDate && formData.endDate) {
            fetchChartData(formData.startDate, formData.endDate);
        }
    }, [formData]);

    // Handle predefined range selection
    const handleRangeSelection = (range) => {
        setSelectedRange(range);
        if (range !== 'custom') {
            const { startDate, endDate } = calculateDateRange(range);
            setFormData({ startDate, endDate });
        }
    };

    // Handle custom date input changes
    const handleChange = (e, { name, value }) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setSelectedRange('custom'); // Switch to custom when user changes date inputs
    };

    // Handle clear functionality
    const handleClear = () => {
        setFormData({
            startDate: '',
            endDate: ''
        });
        setSelectedRange('1m'); // Reset to default range
        // Set to default 1 month range
        const { startDate, endDate } = calculateDateRange('1m');
        setFormData({ startDate, endDate });
    };

    return (
        <div className="line-chart-container">
            <h2>Employee Allocation Overview</h2>
            <div className='filter-tabs'>
                {/* Predefined Range Toggles */}
                <ButtonGroup>
                    <Button 
                        active={selectedRange === '1w'} 
                        onClick={() => handleRangeSelection('1w')}
                    >
                        1 Week
                    </Button>
                    <Button 
                        active={selectedRange === '1m'} 
                        onClick={() => handleRangeSelection('1m')}
                    >
                        1 Month
                    </Button>
                    <Button 
                        active={selectedRange === '3m'} 
                        onClick={() => handleRangeSelection('3m')}
                    >
                        3 Months
                    </Button>
                    <Button 
                        active={selectedRange === '6m'} 
                        onClick={() => handleRangeSelection('6m')}
                    >
                        6 Months
                    </Button>
                    <Button 
                        active={selectedRange === '1y'} 
                        onClick={() => handleRangeSelection('1y')}
                    >
                        1 Year
                    </Button>
                    <Button 
                        active={selectedRange === 'custom'} 
                        onClick={() => handleRangeSelection('custom')}
                    >
                        Custom
                    </Button>
                </ButtonGroup>
                {/* Custom Date Range Selection */}
                <div className="custom-date-picker">
                    <Input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        placeholder="Start Date"
                        aria-label="Start Date"
                        disabled={selectedRange !== 'custom'}
                        style={{ width: '150px' }} // Fixed width
                    />
                    <Input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        placeholder="End Date"
                        aria-label="End Date"
                        disabled={selectedRange !== 'custom'}
                        style={{ width: '150px' }} // Fixed width
                    />
                    <Button onClick={handleClear} primary>Clear</Button>
                </div>
            </div>
            <div className="charts-container">
                {/* Line Chart - 60% Width */}
                <div className="chart-section line-chart">
                    <Line 
                        data={chartData} 
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: {
                                    type: 'category', // Use category for string labels
                                    title: {
                                        display: true,
                                        text: 'Dates',
                                    },
                                    ticks: {
                                        callback: (value, index, ticks) => {
                                            const label = chartData.labels[index];
                                            if (label) {
                                                const dateParts = label.split('-'); // Split the date string
                                                return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`; // Format as DD/MM/YYYY
                                            }
                                            return label; // Fallback in case of unexpected type
                                        },
                                    },
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: 'Number of Employees',
                                    },
                                    ticks: {
                                        beginAtZero: true,
                                        precision: 0, // Ensure integer ticks
                                    },
                                },
                            },
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'top',
                                },
                                tooltip: {
                                    mode: 'index',
                                    intersect: false,
                                },
                            },
                            interaction: {
                                mode: 'nearest',
                                axis: 'x',
                                intersect: false
                            },
                        }}
                    />
                </div>
                {/* Donut Chart - 40% Width */}
                <div className="chart-section donut-chart">
                    <AllocationDonutChart 
                        allocated={latestCounts.allocated}
                        unallocated={latestCounts.unallocated}
                        draft={latestCounts.draft}
                        bench={latestCounts.bench}
                    />
                </div>
            </div>
            </div>
        );
    };
    
    export default LineChartComponent;
