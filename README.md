# Athlete Journal - Personal Mental Performance Tracker

A web application designed for professional athletes to track mental performance through daily ratings and visual analytics.

## Features

### 📊 My Progress Screen
- **Three Chart Types:**
  1. **Bar Chart**: Shows average ratings for each point over selected time period
  2. **Life Wheel**: Pie chart displaying category averages 
  3. **Trash Chart**: Shows deleted points with recovery options

- **Time Filters**: Week, Month, Year, or Custom Date Range
- **Interactive Charts**: Click bars to toggle visibility
- **Chart Navigation**: Use arrows or indicators to switch between charts

### 📝 My Points Screen
- **Category Management**: Create, edit, and delete categories with custom colors
- **Point Management**: Add tracking points to categories with edit/delete options
- **Collapsible Categories**: Click category headers to expand/collapse
- **Trash System**: Deleted points go to trash before permanent deletion

### 📅 Daily Recording
- **Record a Day**: Rate all your points on a 1-10 scale
- **Category Organization**: Points grouped by category with color coding
- **Data Validation**: Must rate all points before saving

### 📈 Past Ratings
- **Historical View**: List of all recorded days with averages
- **Delete Functionality**: Remove specific rating sessions
- **Quick Overview**: See total points and average scores per day

## How to Use

1. **Setup**: 
   - Start by creating categories (e.g., "Mental Focus", "Physical Performance")
   - Add specific points to each category (e.g., "Focus", "Energy", "Preparation")

2. **Daily Tracking**:
   - Click "Record a day" to rate yourself on all points (1-10 scale)
   - Save your ratings to build your performance history

3. **Analysis**:
   - Use the "My Progress" screen to analyze your data
   - Switch between different chart views and time periods
   - Identify patterns and areas for improvement

4. **Management**:
   - Edit points and categories as your needs evolve
   - Use the trash system to safely delete items
   - Review past ratings and delete entries if needed

## Technical Details

- **Storage**: All data stored locally in browser (localStorage)
- **Charts**: Powered by Chart.js library
- **Design**: Matches provided specifications exactly
- **Responsive**: Optimized for both desktop and mobile

## Color Palette
- Background: #2B3D41
- Chart Elements: #AAC0AA  
- Buttons: #5B7B7A
- Accent: #CF5C36
- Text: #DCEED1

## Getting Started

1. Open `index.html` in your web browser
2. Start by creating your first category
3. Add points to track within that category
4. Begin recording your daily ratings
5. Analyze your progress with the built-in charts

## Sample Data

To test the app with sample data, uncomment the last line in `script.js`:
```javascript
initializeSampleData();
```

This will create sample categories (Mental Focus, Physical Performance, Recovery) with example points and some historical data.

---

**Note**: This app stores all data locally in your browser. To backup your data, you can export the localStorage data. For production use, consider implementing cloud storage or database integration.
