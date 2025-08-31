// Global Variables
let currentChart = 0;
let chartInstance = null;
let currentTimeFilter = 'week';
let customDateRange = null;
let editingPointId = null;
let editingCategoryId = null;

// Data Storage Keys
const STORAGE_KEYS = {
    CATEGORIES: 'athleteJournal_categories',
    POINTS: 'athleteJournal_points',
    RATINGS: 'athleteJournal_ratings',
    TRASH: 'athleteJournal_trash'
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize data if first time
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.POINTS)) {
        localStorage.setItem(STORAGE_KEYS.POINTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RATINGS)) {
        localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRASH)) {
        localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify([]));
    }

    loadCategoriesAndPoints();
    updateChart();
    
    // Set up form event listeners
    setupFormEventListeners();
}

function setupFormEventListeners() {
    // Category form
    document.getElementById('category-form').addEventListener('submit', function(e) {
        e.preventDefault();
        createCategory();
    });

    // Point form
    document.getElementById('point-form').addEventListener('submit', function(e) {
        e.preventDefault();
        createPoint();
    });

    // Edit point form
    document.getElementById('edit-point-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEditedPoint();
    });

    // Date range form
    document.getElementById('date-range-form').addEventListener('submit', function(e) {
        e.preventDefault();
        applyDateRange();
    });

    // Edit category form
    document.getElementById('edit-category-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEditedCategory();
    });

    // Time filter change
    document.getElementById('time-filter').addEventListener('change', function() {
        const value = this.value;
        if (value === 'custom') {
            openDateRangeModal();
        } else {
            currentTimeFilter = value;
            customDateRange = null;
            updateChart();
        }
    });
}

// Data Management Functions
function getCategories() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
}

function getPoints() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.POINTS) || '[]');
}

function getRatings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RATINGS) || '[]');
}

function getTrash() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRASH) || '[]');
}

function saveCategories(categories) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
}

function savePoints(points) {
    localStorage.setItem(STORAGE_KEYS.POINTS, JSON.stringify(points));
}

function saveRatings(ratings) {
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratings));
}

function saveTrash(trash) {
    localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(trash));
}

// Navigation Functions
function showScreen(screenName) {
    // Remove active class from all screens and nav items
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to selected screen and nav item
    document.getElementById(screenName + '-screen').classList.add('active');
    event.target.classList.add('active');

    if (screenName === 'points') {
        loadCategoriesAndPoints();
    }
}

// Chart Functions
function showChart(chartIndex) {
    currentChart = chartIndex;
    
    // Update indicators
    document.querySelectorAll('.indicator').forEach((indicator, index) => {
        indicator.classList.toggle('active', index === chartIndex);
    });

    // Update chart title
    updateChartTitle();

    // Hide/show trash list based on chart
    const trashList = document.getElementById('trash-list');
    if (chartIndex === 2) {
        trashList.classList.remove('hidden');
        loadTrashList();
    } else {
        trashList.classList.add('hidden');
    }

    updateChart();
}

function updateChartTitle() {
    const titleElement = document.querySelector('.chart-title');
    const titles = ['Points summary', 'Category averages', 'Deleted points'];
    titleElement.textContent = titles[currentChart];
}

function nextChart() {
    currentChart = (currentChart + 1) % 3;
    showChart(currentChart);
}

function previousChart() {
    currentChart = (currentChart - 1 + 3) % 3;
    showChart(currentChart);
}

function updateChart() {
    const chartData = getChartData();
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    const ctx = document.getElementById('mainChart').getContext('2d');

    // Update chart title
    updateChartTitle();

    switch (currentChart) {
        case 0:
            createBarChart(ctx, chartData);
            break;
        case 1:
            createPieChart(ctx, chartData);
            break;
        case 2:
            createTrashChart(ctx, chartData);
            break;
    }
}

function getChartData() {
    const points = getPoints();
    const categories = getCategories();
    const ratings = getRatings();
    const trash = getTrash();
    
    const filteredRatings = filterRatingsByTimeRange(ratings);
    
    if (currentChart === 2) {
        // Trash chart data
        return getTrashChartData(trash);
    } else if (currentChart === 1) {
        // Pie chart data (category averages)
        return getCategoryAverages(filteredRatings, categories, points);
    } else {
        // Bar chart data (point averages)
        return getPointAverages(filteredRatings, points);
    }
}

function filterRatingsByTimeRange(ratings) {
    const now = new Date();
    let startDate, endDate;

    if (customDateRange) {
        startDate = new Date(customDateRange.start);
        endDate = new Date(customDateRange.end);
    } else {
        switch (currentTimeFilter) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                endDate = now;
                break;
            case 'year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                endDate = now;
                break;
            default:
                return ratings;
        }
    }

    return ratings.filter(rating => {
        const ratingDate = new Date(rating.date);
        return ratingDate >= startDate && ratingDate <= endDate;
    });
}

function getPointAverages(ratings, points) {
    const pointAverages = {};
    const pointCounts = {};

    ratings.forEach(rating => {
        Object.keys(rating.ratings).forEach(pointId => {
            if (!pointAverages[pointId]) {
                pointAverages[pointId] = 0;
                pointCounts[pointId] = 0;
            }
            pointAverages[pointId] += rating.ratings[pointId];
            pointCounts[pointId]++;
        });
    });

    const labels = [];
    const data = [];
    const colors = [];

    points.forEach(point => {
        if (pointAverages[point.id]) {
            const average = pointAverages[point.id] / pointCounts[point.id];
            labels.push(point.name);
            data.push(average);
            
            const category = getCategories().find(cat => cat.id === point.categoryId);
            colors.push(category ? category.color : '#AAC0AA');
        }
    });

    return { labels, data, colors };
}

function getCategoryAverages(ratings, categories, points) {
    const categoryAverages = {};
    const categoryCounts = {};

    ratings.forEach(rating => {
        Object.keys(rating.ratings).forEach(pointId => {
            const point = points.find(p => p.id === pointId);
            if (point) {
                const categoryId = point.categoryId;
                if (!categoryAverages[categoryId]) {
                    categoryAverages[categoryId] = 0;
                    categoryCounts[categoryId] = 0;
                }
                categoryAverages[categoryId] += rating.ratings[pointId];
                categoryCounts[categoryId]++;
            }
        });
    });

    const labels = [];
    const data = [];
    const colors = [];

    categories.forEach(category => {
        if (categoryAverages[category.id]) {
            const average = categoryAverages[category.id] / categoryCounts[category.id];
            labels.push(category.name);
            data.push(average);
            colors.push(category.color);
        }
    });

    return { labels, data, colors };
}

function getTrashChartData(trash) {
    const labels = trash.map(item => item.name);
    
    // Calculate average rating for each deleted point
    const data = trash.map(item => {
        if (item.ratings && item.ratings.length > 0) {
            const sum = item.ratings.reduce((total, rating) => total + rating.value, 0);
            return sum / item.ratings.length;
        }
        return 0;
    });
    
    const colors = trash.map(() => '#CF5C36');

    return { labels, data, colors };
}

function createBarChart(ctx, chartData) {
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data,
                backgroundColor: chartData.colors,
                borderWidth: 0,
                borderRadius: 10,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#DCEED1',
                        font: {
                            family: 'Lato'
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#DCEED1',
                        font: {
                            family: 'Lato'
                        },
                        maxRotation: 45
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    toggleBarVisibility(index);
                }
            }
        }
    });
}

function createPieChart(ctx, chartData) {
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data,
                backgroundColor: chartData.colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#DCEED1',
                        font: {
                            family: 'Lato',
                            size: 14
                        },
                        padding: 20
                    }
                }
            }
        }
    });
}

function createTrashChart(ctx, chartData) {
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data,
                backgroundColor: chartData.colors,
                borderWidth: 0,
                borderRadius: 10,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    display: false
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#DCEED1',
                        font: {
                            family: 'Lato'
                        },
                        maxRotation: 45
                    }
                }
            }
        }
    });
}

function toggleBarVisibility(index) {
    if (chartInstance && chartInstance.data.datasets[0]) {
        const meta = chartInstance.getDatasetMeta(0);
        meta.data[index].hidden = !meta.data[index].hidden;
        chartInstance.update();
    }
}

// Modal Functions
function openRecordDayModal() {
    const modal = document.getElementById('record-day-modal');
    loadGradingInterface();
    modal.style.display = 'block';
}

function closeRecordDayModal() {
    document.getElementById('record-day-modal').style.display = 'none';
}

function openPastRatingsModal() {
    const modal = document.getElementById('past-ratings-modal');
    loadPastRatings();
    modal.style.display = 'block';
}

function closePastRatingsModal() {
    document.getElementById('past-ratings-modal').style.display = 'none';
}

function openCreateCategoryModal() {
    document.getElementById('create-category-modal').style.display = 'block';
}

function closeCreateCategoryModal() {
    document.getElementById('create-category-modal').style.display = 'none';
    document.getElementById('category-form').reset();
}

function openCreatePointModal(categoryId) {
    const modal = document.getElementById('create-point-modal');
    const categorySelect = document.getElementById('point-category');
    
    // Populate category dropdown
    categorySelect.innerHTML = '<option value="">Select category</option>';
    const categories = getCategories();
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        if (categoryId && category.id === categoryId) {
            option.selected = true;
        }
        categorySelect.appendChild(option);
    });
    
    modal.style.display = 'block';
}

function closeCreatePointModal() {
    document.getElementById('create-point-modal').style.display = 'none';
    document.getElementById('point-form').reset();
}

function openEditPointModal(pointId) {
    const points = getPoints();
    const point = points.find(p => p.id === pointId);
    if (point) {
        editingPointId = pointId;
        document.getElementById('edit-point-name').value = point.name;
        document.getElementById('edit-point-modal').style.display = 'block';
    }
}

function closeEditPointModal() {
    document.getElementById('edit-point-modal').style.display = 'none';
    document.getElementById('edit-point-form').reset();
    editingPointId = null;
}

function openDateRangeModal() {
    document.getElementById('date-range-modal').style.display = 'block';
}

function closeDateRangeModal() {
    document.getElementById('date-range-modal').style.display = 'none';
    document.getElementById('date-range-form').reset();
    // Reset filter to week if user cancels
    document.getElementById('time-filter').value = 'week';
}

function openEditCategoryModal(categoryId) {
    const categories = getCategories();
    const category = categories.find(c => c.id === categoryId);
    if (category) {
        editingCategoryId = categoryId;
        document.getElementById('edit-category-name').value = category.name;
        
        // Set the correct radio button for color
        const colorRadio = document.querySelector(`input[name="edit-category-color"][value="${category.color}"]`);
        if (colorRadio) {
            colorRadio.checked = true;
        }
        
        document.getElementById('edit-category-modal').style.display = 'block';
    }
}

function closeEditCategoryModal() {
    document.getElementById('edit-category-modal').style.display = 'none';
    document.getElementById('edit-category-form').reset();
    editingCategoryId = null;
}

// Category Management
function createCategory() {
    const name = document.getElementById('category-name').value.trim();
    const colorRadio = document.querySelector('input[name="category-color"]:checked');
    const color = colorRadio ? colorRadio.value : '#AAC0AA';
    
    if (!name) return;

    const categories = getCategories();
    const newCategory = {
        id: generateId(),
        name: name,
        color: color,
        collapsed: false
    };

    categories.push(newCategory);
    saveCategories(categories);
    loadCategoriesAndPoints();
    closeCreateCategoryModal();
}

function saveEditedCategory() {
    const name = document.getElementById('edit-category-name').value.trim();
    const colorRadio = document.querySelector('input[name="edit-category-color"]:checked');
    const color = colorRadio ? colorRadio.value : '#AAC0AA';
    
    if (!name || !editingCategoryId) return;

    const categories = getCategories();
    const category = categories.find(c => c.id === editingCategoryId);
    if (category) {
        category.name = name;
        category.color = color;
        saveCategories(categories);
        loadCategoriesAndPoints();
        closeEditCategoryModal();
        updateChart();
    }
}

function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category? All points in this category will be moved to trash.')) {
        return;
    }

    const categories = getCategories();
    const points = getPoints();
    const trash = getTrash();
    const ratings = getRatings();

    // Move points to trash with their ratings
    const categoryPoints = points.filter(point => point.categoryId === categoryId);
    categoryPoints.forEach(point => {
        // Collect all ratings for this point
        const pointRatings = [];
        ratings.forEach(rating => {
            if (rating.ratings[point.id] !== undefined) {
                pointRatings.push({
                    date: rating.date,
                    timestamp: rating.timestamp,
                    value: rating.ratings[point.id]
                });
            }
        });

        trash.push({
            id: point.id,
            name: point.name,
            originalCategoryId: point.categoryId,
            ratings: pointRatings
        });
    });

    // Remove category and its points
    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    const updatedPoints = points.filter(point => point.categoryId !== categoryId);

    saveCategories(updatedCategories);
    savePoints(updatedPoints);
    saveTrash(trash);
    loadCategoriesAndPoints();
    updateChart();
}

function toggleCategory(categoryId) {
    const categories = getCategories();
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
        category.collapsed = !category.collapsed;
        saveCategories(categories);
        loadCategoriesAndPoints();
    }
}

// Point Management
function createPoint() {
    const name = document.getElementById('point-name').value.trim();
    const categoryId = document.getElementById('point-category').value;
    
    if (!name || !categoryId) return;

    const points = getPoints();
    const newPoint = {
        id: generateId(),
        name: name,
        categoryId: categoryId
    };

    points.push(newPoint);
    savePoints(points);
    loadCategoriesAndPoints();
    closeCreatePointModal();
}

function saveEditedPoint() {
    const name = document.getElementById('edit-point-name').value.trim();
    
    if (!name || !editingPointId) return;

    const points = getPoints();
    const point = points.find(p => p.id === editingPointId);
    if (point) {
        point.name = name;
        savePoints(points);
        loadCategoriesAndPoints();
        closeEditPointModal();
        updateChart();
    }
}

function deletePoint(pointId) {
    if (!confirm('Are you sure you want to delete this point? It will be moved to trash.')) {
        return;
    }

    const points = getPoints();
    const trash = getTrash();
    const ratings = getRatings();
    const point = points.find(p => p.id === pointId);

    if (point) {
        // Collect all ratings for this point
        const pointRatings = [];
        ratings.forEach(rating => {
            if (rating.ratings[pointId] !== undefined) {
                pointRatings.push({
                    date: rating.date,
                    timestamp: rating.timestamp,
                    value: rating.ratings[pointId]
                });
            }
        });

        trash.push({
            id: point.id,
            name: point.name,
            originalCategoryId: point.categoryId,
            ratings: pointRatings
        });

        const updatedPoints = points.filter(p => p.id !== pointId);
        savePoints(updatedPoints);
        saveTrash(trash);
        loadCategoriesAndPoints();
        updateChart();
    }
}

function permanentlyDeleteTrashItem(itemId) {
    if (!confirm('Are you sure you want to permanently delete this point? This action cannot be undone.')) {
        return;
    }

    const trash = getTrash();
    const updatedTrash = trash.filter(item => item.id !== itemId);
    saveTrash(updatedTrash);
    loadTrashList();
    updateChart();
}

// UI Loading Functions
function loadCategoriesAndPoints() {
    const container = document.getElementById('categories-container');
    const categories = getCategories();
    const points = getPoints();

    container.innerHTML = '';

    categories.forEach(category => {
        const categoryPoints = points.filter(point => point.categoryId === category.id);
        
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-item';
        categoryElement.innerHTML = `
            <div class="category-header" onclick="toggleCategory('${category.id}')">
                <div class="category-info">
                    <div class="category-color" style="background-color: ${category.color}"></div>
                    <span class="category-name">${category.name}</span>
                </div>
                <div class="category-actions">
                    <button class="edit-btn" onclick="event.stopPropagation(); openEditCategoryModal('${category.id}')">✏️</button>
                    <button class="delete-btn" onclick="event.stopPropagation(); deleteCategory('${category.id}')">🗑️</button>
                </div>
            </div>
            <div class="category-points ${category.collapsed ? 'collapsed' : ''}">
                <button class="create-point-btn" onclick="openCreatePointModal('${category.id}')">
                    <span>+</span>
                    Create a point
                </button>
                ${categoryPoints.map(point => `
                    <div class="point-item">
                        <span class="point-name">${point.name}</span>
                        <div class="point-actions">
                            <button class="edit-btn" onclick="openEditPointModal('${point.id}')">✏️</button>
                            <button class="delete-btn" onclick="deletePoint('${point.id}')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.appendChild(categoryElement);
    });
}

function loadGradingInterface() {
    const container = document.getElementById('grading-container');
    const categories = getCategories();
    const points = getPoints();

    container.innerHTML = '';

    categories.forEach(category => {
        const categoryPoints = points.filter(point => point.categoryId === category.id);
        
        if (categoryPoints.length > 0) {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'grading-category';
            categoryElement.innerHTML = `
                <h3>
                    <div class="category-color" style="background-color: ${category.color}"></div>
                    ${category.name}
                </h3>
                ${categoryPoints.map(point => `
                    <div class="grading-point">
                        <span class="point-label">${point.name}</span>
                        <div class="rating-scale">
                            ${Array.from({length: 10}, (_, i) => i + 1).map(num => 
                                `<button type="button" class="rating-btn" onclick="selectRating('${point.id}', ${num})">${num}</button>`
                            ).join('')}
                        </div>
                    </div>
                `).join('')}
            `;
            
            container.appendChild(categoryElement);
        }
    });
}

function loadPastRatings() {
    const container = document.getElementById('past-ratings-list');
    const ratings = getRatings().sort((a, b) => {
        // Sort by timestamp if available, otherwise by date
        const aTime = a.timestamp ? new Date(a.timestamp) : new Date(a.date);
        const bTime = b.timestamp ? new Date(b.timestamp) : new Date(b.date);
        return bTime - aTime;
    });
    
    container.innerHTML = '';

    ratings.forEach(rating => {
        const date = new Date(rating.date).toLocaleDateString();
        const time = rating.timestamp ? new Date(rating.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
        const totalPoints = Object.keys(rating.ratings).length;
        const averageScore = Object.values(rating.ratings).reduce((sum, val) => sum + val, 0) / totalPoints;
        
        const ratingElement = document.createElement('div');
        ratingElement.className = 'past-rating-item';
        ratingElement.innerHTML = `
            <div class="rating-info">
                <span class="rating-date">${date}</span>
                ${time ? `<span class="rating-time">${time}</span>` : ''}
            </div>
            <span class="rating-summary">${totalPoints} points • Avg: ${averageScore.toFixed(1)}</span>
            <button class="delete-rating-btn" onclick="deleteRating('${rating.id}')">Delete</button>
        `;
        
        container.appendChild(ratingElement);
    });
}

function loadTrashList() {
    const container = document.getElementById('trash-items');
    const trash = getTrash();
    
    container.innerHTML = '';

    trash.forEach(item => {
        const trashElement = document.createElement('div');
        trashElement.className = 'trash-item';
        trashElement.innerHTML = `
            <span>${item.name}</span>
            <button class="delete-forever-btn" onclick="permanentlyDeleteTrashItem('${item.id}')">Delete Forever</button>
        `;
        
        container.appendChild(trashElement);
    });
}

// Rating Functions
let currentDayRatings = {};

function selectRating(pointId, rating) {
    currentDayRatings[pointId] = rating;
    
    // Update button appearance
    const pointElement = event.target.closest('.grading-point');
    const buttons = pointElement.querySelectorAll('.rating-btn');
    buttons.forEach((btn, index) => {
        btn.classList.toggle('selected', index + 1 === rating);
    });
}

function saveDay() {
    const points = getPoints();
    const requiredPointIds = points.map(p => p.id);
    const providedRatings = Object.keys(currentDayRatings);
    
    // Check if all points have ratings
    if (requiredPointIds.length > 0 && !requiredPointIds.every(id => providedRatings.includes(id))) {
        alert('Please rate all points before saving.');
        return;
    }

    const ratings = getRatings();
    const newRating = {
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        ratings: {...currentDayRatings}
    };

    ratings.push(newRating);
    saveRatings(ratings);
    
    currentDayRatings = {};
    closeRecordDayModal();
    updateChart();
    
    alert('Day recorded successfully!');
}

function deleteRating(ratingId) {
    if (!confirm('Are you sure you want to delete this rating?')) {
        return;
    }

    const ratings = getRatings();
    const updatedRatings = ratings.filter(rating => rating.id !== ratingId);
    saveRatings(updatedRatings);
    loadPastRatings();
    updateChart();
}

// Date Range Functions
function applyDateRange() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates.');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        alert('Start date must be before end date.');
        return;
    }

    customDateRange = { start: startDate, end: endDate };
    currentTimeFilter = 'custom';
    closeDateRangeModal();
    updateChart();
}

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}


// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Close modals with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }
});

// Sample Data for Testing (remove in production)
function initializeSampleData() {
    // Create sample categories
    const sampleCategories = [
        { id: 'cat1', name: 'Mental Focus', color: '#CF5C36', collapsed: false },
        { id: 'cat2', name: 'Physical Performance', color: '#AAC0AA', collapsed: false },
        { id: 'cat3', name: 'Recovery', color: '#5B7B7A', collapsed: false }
    ];

    // Create sample points
    const samplePoints = [
        { id: 'point1', name: 'Focus', categoryId: 'cat1' },
        { id: 'point2', name: 'Preparation', categoryId: 'cat1' },
        { id: 'point3', name: 'Energy', categoryId: 'cat2' },
        { id: 'point4', name: 'Productivity', categoryId: 'cat2' },
        { id: 'point5', name: 'My reaction', categoryId: 'cat3' },
        { id: 'point6', name: 'Compromises', categoryId: 'cat3' },
        { id: 'point7', name: 'Head position', categoryId: 'cat2' }
    ];

    // Create sample ratings for the past week
    const sampleRatings = [];
    for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const ratings = {};
        samplePoints.forEach(point => {
            ratings[point.id] = Math.floor(Math.random() * 6) + 5; // Random ratings 5-10
        });

        sampleRatings.push({
            id: generateId(),
            date: date.toISOString().split('T')[0],
            ratings: ratings
        });
    }

    saveCategories(sampleCategories);
    savePoints(samplePoints);
    saveRatings(sampleRatings);
}

// Uncomment the next line to initialize with sample data for testing
// initializeSampleData();
