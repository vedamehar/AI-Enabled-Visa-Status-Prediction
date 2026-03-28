// =============================================
// H-1B Visa Processing Time Estimator
// Frontend JavaScript
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('predictionForm');
    
    form.addEventListener('submit', handleFormSubmit);
});

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const caseStatus = document.getElementById('caseStatus').value;
    const submissionMonth = document.getElementById('month').value;
    const submissionQuarter = document.getElementById('quarter').value;
    const submissionDayofweek = document.getElementById('dayOfWeek').value;
    const caseYear = document.getElementById('year').value;
    
    // Validate all fields are filled
    if (!caseStatus || !submissionMonth || !submissionQuarter || 
        !submissionDayofweek || !caseYear) {
        showError('Please fill in all fields');
        return;
    }
    
    // Show loading state
    showLoading(true);
    hideError();
    hideResults();
    
    try {
        // Make API call
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                case_status: caseStatus,
                submission_month: submissionMonth,
                submission_quarter: submissionQuarter,
                submission_dayofweek: submissionDayofweek,
                case_year: caseYear
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Prediction failed');
        }
        
        // Display results
        displayResults(data.prediction);
        
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

/**
 * Display prediction results
 */
function displayResults(prediction) {
    const container = document.getElementById('resultsContainer');
    const emptyState = document.getElementById('emptyState');
    
    // Get form values for summary
    const caseStatus = document.getElementById('caseStatus').value;
    const month = parseInt(document.getElementById('month').value);
    const quarter = parseInt(document.getElementById('quarter').value);
    const dayOfWeek = parseInt(document.getElementById('dayOfWeek').value);
    const year = parseInt(document.getElementById('year').value);
    
    // Month names
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Day names
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Update main prediction
    document.getElementById('predictedDays').textContent = prediction.predicted_days;
    document.getElementById('rangeLower').textContent = prediction.range_min;
    document.getElementById('rangeUpper').textContent = prediction.range_max;
    document.getElementById('marginValue').textContent = prediction.confidence_margin;
    
    // Update summary
    document.getElementById('summaryStatus').textContent = caseStatus;
    document.getElementById('summaryMonth').textContent = monthNames[month];
    document.getElementById('summaryQuarter').textContent = `Q${quarter}`;
    document.getElementById('summaryDay').textContent = dayNames[dayOfWeek];
    document.getElementById('summaryYear').textContent = year;
    
    // Update range visualization
    const minRange = 0;
    const maxRange = Math.max(100, prediction.range_max * 1.5);
    const currentValue = prediction.predicted_days;
    
    // Calculate percentage for fill bar
    const fillPercentage = (currentValue - minRange) / (maxRange - minRange) * 100;
    const markerPercentage = fillPercentage;
    
    document.getElementById('rangeFill').style.width = (fillPercentage + 5) + '%';
    document.getElementById('rangeMarker').style.left = markerPercentage + '%';
    
    // Update range labels
    document.getElementById('rangeMinLabel').textContent = Math.round(minRange);
    document.getElementById('rangeCenterLabel').textContent = Math.round(currentValue) + ' days';
    document.getElementById('rangeMaxLabel').textContent = Math.round(maxRange);
    
    // ===== UPDATE ANALYSIS SECTION =====
    
    // Case Status Impact
    const statusAnalysis = {
        'CERTIFIED': { note: 'Approved cases typically process smoothly with standard timeline.' },
        'DENIED': { note: 'Rejected cases may have extended processing due to review requirements.' },
        'WITHDRAWN': { note: 'Withdrawn cases show variable processing times based on submission phase.' },
        'PENDING_REVIEW': { note: 'Cases under review experience longer processing durations.' }
    };
    
    const statusInfo = statusAnalysis[caseStatus] || { note: 'Status analysis unavailable' };
    document.getElementById('analysisStatus').textContent = caseStatus;
    document.getElementById('analysisStatusNote').textContent = statusInfo.note;
    
    // Seasonal Impact
    const seasonalAnalysis = {
        1: { season: 'Q1 (Jan-Mar)', note: 'Lower application volume; typically faster processing.' },
        2: { season: 'Q2 (Apr-Jun)', note: 'Moderate volume; standard processing timelines.' },
        3: { season: 'Q3 (Jul-Sep)', note: 'Higher volume period; may experience delays.' },
        4: { season: 'Q4 (Oct-Dec)', note: 'Peak season; highest volume, longer queues expected.' }
    };
    
    const seasonInfo = seasonalAnalysis[quarter];
    document.getElementById('analysisSeason').textContent = seasonInfo.season;
    document.getElementById('analysisSeasonNote').textContent = seasonInfo.note;
    
    // Processing Efficiency
    let efficiency = 'Normal';
    let efficiencyNote = 'Standard USCIS processing capacity.';
    
    if (currentValue < 30) {
        efficiency = 'Fast';
        efficiencyNote = 'Excellent processing conditions and lower workload.';
    } else if (currentValue < 60) {
        efficiency = 'Standard';
        efficiencyNote = 'Normal USCIS processing capacity and workload.';
    } else {
        efficiency = 'Slow';
        efficiencyNote = 'High workload or complex review requirements.';
    }
    
    document.getElementById('analysisEfficiency').textContent = efficiency;
    document.getElementById('analysisEfficiencyNote').textContent = efficiencyNote;
    
    // Generate Key Insights
    const insights = [];
    
    if (quarter === 4) {
        insights.push('Q4 submissions experience higher processing times due to peak season volume.');
    } else if (quarter === 1) {
        insights.push('Q1 submissions benefit from lower application volume, typically resulting in faster processing.');
    }
    
    if (caseStatus === 'CERTIFIED') {
        insights.push('Your CERTIFIED status indicates a positive determination, supporting timely processing.');
    } else if (caseStatus === 'PENDING_REVIEW') {
        insights.push('Pending cases may require additional review, potentially extending the timeline.');
    }
    
    if (Math.abs(currentValue - prediction.predicted_days) < 5) {
        insights.push('Your prediction falls within the model\'s highest confidence range based on historical data.');
    }
    
    if (insights.length < 3) {
        insights.push('Processing times vary based on individual case complexity and USCIS workload.');
    }
    
    // Display insights
    document.getElementById('insight1').textContent = insights[0] || 'Historical data shows variable processing times.';
    document.getElementById('insight2').textContent = insights[1] || 'Your case parameters are within normal range.';
    document.getElementById('insight3').textContent = insights[2] || 'Monitor USCIS updates for policy changes affecting timelines.';
    
    // Generate Recommendation
    let recommendation = '';
    if (currentValue <= 30) {
        recommendation = '✓ Expected fast-track processing. Plan accordingly for potential expedited approval.';
    } else if (currentValue <= 60) {
        recommendation = '→ Expect standard processing timeline. Allow buffer time for further communications.';
    } else {
        recommendation = '⚠ Longer processing expected. Consider working with immigration attorney if needed.';
    }
    
    document.getElementById('recommendationText').textContent = recommendation;
    
    // Show container, hide empty state
    container.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    // Scroll to results
    scrollTo(container);
}

/**
 * Show error message
 */
function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = `Error: ${message}`;
    errorContainer.classList.remove('hidden');
    
    scrollTo(errorContainer);
}

/**
 * Hide error message
 */
function hideError() {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.classList.add('hidden');
}

/**
 * Show/hide results
 */
function hideResults() {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.classList.add('hidden');
}

/**
 * Show/hide loading state
 */
function showLoading(show) {
    const loadingContainer = document.getElementById('loadingContainer');
    if (show) {
        loadingContainer.classList.remove('hidden');
    } else {
        loadingContainer.classList.add('hidden');
    }
}

/**
 * Smooth scroll to element
 */
function scrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
    });
}
