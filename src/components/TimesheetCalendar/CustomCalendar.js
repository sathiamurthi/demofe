// src/pages/TimesheetCalendar/CustomCalendar.jsx

import React, { useState, useEffect } from 'react';
import { Grid, Button, Header, Icon, Popup } from 'semantic-ui-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { holidays } from './holidays'; // Import the holidays list
import './CustomCalendar.css';

const CustomCalendar = ({ viewMode, currentWeek, selectedDay, onWeekChange, onDayChange, region }) => { // Accept region as a prop
  const [currentDate, setCurrentDate] = useState(new Date());

  const headerFormat = 'MMMM yyyy';
  // Start the week on Monday
  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  useEffect(() => {
    if (viewMode === 'week' && currentWeek) {
      setCurrentDate(currentWeek);
    } else if (viewMode === 'day' && selectedDay) {
      setCurrentDate(selectedDay);
    }
  }, [viewMode, currentWeek, selectedDay]);

  const renderHeader = () => {
    return (
      <Grid.Row className="header-row" verticalAlign="middle">
        <Grid.Column width={2} textAlign="left">
          <Button icon onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <Icon name="chevron left" />
          </Button>
        </Grid.Column>
        <Grid.Column width={12} textAlign="center">
          <Header as="h2">{format(currentDate, headerFormat)}</Header>
        </Grid.Column>
        <Grid.Column width={2} textAlign="right">
          <Button icon onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <Icon name="chevron right" />
          </Button>
        </Grid.Column>
      </Grid.Row>
    );
  };

  const renderDays = () => {
    return (
      <Grid.Row>
        {daysOfWeek.map((day, index) => (
          <Grid.Column key={index} textAlign="center" className="day-header">
            {day}
          </Grid.Column>
        ))}
      </Grid.Row>
    );
  };

  // Helper function to get holidays based on region
  const getHolidaysForRegion = () => {
    if (!region) return []; // If region is null or undefined, return empty array
    return holidays[region] || []; // Otherwise, return holidays for the region
  };
  

  const isHoliday = (day) => {
    const regionalHolidays = getHolidaysForRegion();
    return regionalHolidays.find(holiday => isSameDay(day, parseISO(holiday.date)));
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    // Set weekStartsOn to 1 (Monday)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = 'd';
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const isToday = isSameDay(day, new Date());

        // Determine if the day is within the selected week or is the selected day
        let isSelected = false;
        if (viewMode === 'week' && currentWeek) {
          const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
          isSelected = isWithinInterval(day, { start: weekStart, end: weekEnd });
        } else if (viewMode === 'day' && selectedDay) {
          isSelected = isSameDay(day, selectedDay);
        }

        // Check if the day is a holiday/event
        const holiday = isHoliday(day);

        days.push(
          <Grid.Column
            key={day}
            className={`day-cell ${
              !isSameMonth(day, monthStart) ? 'disabled' : ''
            } ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${
              holiday ? 'holiday' : ''
            }`}
          >
            {holiday ? (
              <Popup
                content={holiday.name}
                trigger={
                  <Button
                    className="day-button"
                    onClick={() => handleDateClick(cloneDay)}
                  >
                    {formattedDate}
                  </Button>
                }
                position="top center"
                inverted
                size="tiny"
              />
            ) : (
              <Button
                className="day-button"
                onClick={() => handleDateClick(cloneDay)}
              >
                {formattedDate}
              </Button>
            )}
          </Grid.Column>
        );
        day = addDays(day, 1);
      }
      rows.push(<Grid.Row key={day} className="calendar-cells-row">{days}</Grid.Row>);
      days = [];
    }
    return <>{rows}</>;
  };

  const handleDateClick = (day) => {
    if (viewMode === 'week') {
      // When in week view, set the week to the clicked date's week
      onWeekChange(startOfWeek(day, { weekStartsOn: 1 }));
    } else if (viewMode === 'day') {
      // When in day view, set the selected day
      onDayChange(day);
    }
  };

  return (
    <div className="calendar-container">
      <Grid columns={7} divided className="calendar-grid">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </Grid>
    </div>
  );
};

export default CustomCalendar;