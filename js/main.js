document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const uploadCard = document.getElementById('upload-card');
  
  // Flow States
  const dropzoneState = document.getElementById('dropzone-state');
  const scoutFlow = document.getElementById('scout-flow');
  const scoutResults = document.getElementById('scout-results');
  
  // Interactive Elements
  const videoPreview = document.getElementById('video-preview');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressPct = document.getElementById('progress-pct');
  const logContainer = document.getElementById('log-container');
  const resetBtn = document.getElementById('reset-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const sampleBtns = document.querySelectorAll('.sample-btn');
  
  // Results Elements
  const resultTitle = document.getElementById('result-title');
  const resultScore = document.getElementById('result-score');
  const metricBars = document.querySelectorAll('.metric-bar__fill');
  const metricValues = document.querySelectorAll('.metric-row__val');
  const verdictStrong = document.getElementById('verdict-strong');
  const verdictText = document.getElementById('verdict-text');
  const mobileToggle = document.getElementById('nav-menu-toggle');
  const navMenu = document.getElementById('nav-menu-list');
  
  let analysisInterval = null;
  let currentFile = null;

  // Mock Analysis Logs Timeline
  const battingLogs = [
    { progress: 5, text: "Initializing Gully-Vision Video Pipeline..." },
    { progress: 15, text: "Decompressing video frames & synchronizing fps..." },
    { progress: 28, text: "Running BlazePose: Extracting 33 body coordinate landmarks..." },
    { progress: 42, text: "Analyzing batting stance stability: Balance index 88%." },
    { progress: 58, text: "Detecting backlift angle: 78° trajectory. Optimal path match." },
    { progress: 70, text: "Calculating wrist extension and swing velocity: 94km/h." },
    { progress: 85, text: "Biomechanical Score calculated. Compiling metrics..." },
    { progress: 95, text: "Generating scouting summary & academy email pitch draft..." },
    { progress: 100, text: "Analysis Complete!" }
  ];

  const bowlingLogs = [
    { progress: 5, text: "Initializing Gully-Vision Video Pipeline..." },
    { progress: 15, text: "Loading custom bowling biomechanics neural engine..." },
    { progress: 28, text: "Running joint-pose estimator. Detecting release arm angle..." },
    { progress: 45, text: "Measuring approach speed & stride length. Deceleration curve 92%." },
    { progress: 62, text: "Analyzing release height and follow-through hip alignment..." },
    { progress: 78, text: "Detecting delivery type: Fast/Medium-Fast Outswing..." },
    { progress: 90, text: "Scoring seam presentation and wrist snap mechanics..." },
    { progress: 100, text: "Analysis Complete!" }
  ];

  // Visual Setup - Drag and Drop Listeners
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.remove('dragover');
    }, false);
  });

  // Handle file drop
  uploadZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleVideoInput(files[0]);
    }
  });

  // Handle dropzone click
  uploadZone.addEventListener('click', () => {
    fileInput.click();
  });

  // Handle file selection
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleVideoInput(e.target.files[0]);
    }
  });

  // Handle sample video click
  sampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type');
      const videoSrc = btn.getAttribute('data-video');
      
      // Load sample video and run simulation
      showFlowState();
      videoPreview.src = videoSrc;
      videoPreview.load();
      videoPreview.play().catch(() => {
        // Fallback if autoplay is blocked
        console.log("Autoplay blocked, running visual scanner anyway.");
      });
      
      startAnalysisSimulation(type);
    });
  });

  // Handle resetting flow
  resetBtn.addEventListener('click', resetToUpload);
  cancelBtn.addEventListener('click', () => {
    if (analysisInterval) clearInterval(analysisInterval);
    resetToUpload();
  });

  // Process the video input
  function handleVideoInput(file) {
    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please upload a valid MP4 or MOV cricket video file.');
      return;
    }
    
    currentFile = file;
    const objectURL = URL.createObjectURL(file);
    
    showFlowState();
    videoPreview.src = objectURL;
    videoPreview.load();
    videoPreview.play().catch(() => {});
    
    // Default to batting log sequence
    startAnalysisSimulation('batting');
  }

  // Visual layout toggles
  function showFlowState() {
    dropzoneState.style.display = 'none';
    scoutFlow.classList.add('active');
    scoutResults.classList.remove('active');
    scoutFlow.classList.add('analyzing');
    
    // Clear logs
    logContainer.innerHTML = '';
    progressBarFill.style.width = '0%';
    progressPct.textContent = '0%';
  }

  function resetToUpload() {
    scoutFlow.classList.remove('active');
    scoutFlow.classList.remove('analyzing');
    scoutResults.classList.remove('active');
    dropzoneState.style.display = 'block';
    
    // Reset video player
    videoPreview.pause();
    videoPreview.src = '';
    
    if (analysisInterval) clearInterval(analysisInterval);
    currentFile = null;
    fileInput.value = '';
  }

  // Simulated AI Video Processing
  function startAnalysisSimulation(type) {
    const logs = type === 'batting' ? battingLogs : bowlingLogs;
    let progress = 0;
    let logIndex = 0;
    
    progressBarFill.style.width = '0%';
    progressPct.textContent = '0%';

    // Add first log
    appendLog(logs[0].text, true);
    logIndex++;
    
    const intervalTime = 40; // Total duration approx 4 seconds (100 * 40ms)
    
    analysisInterval = setInterval(() => {
      progress += 1;
      
      // Cap at 100
      if (progress >= 100) {
        progress = 100;
        clearInterval(analysisInterval);
        
        // Finalize state
        setTimeout(() => {
          showResults(type);
        }, 800);
      }
      
      progressBarFill.style.width = `${progress}%`;
      progressPct.textContent = `${progress}%`;
      
      // Check if we need to print a new log
      if (logIndex < logs.length && progress >= logs[logIndex].progress) {
        const log = logs[logIndex];
        const isHighlight = log.progress === 100 || log.progress === 5 || log.progress === 85;
        appendLog(log.text, isHighlight);
        logIndex++;
      }
    }, intervalTime);
  }

  // Helper to add lines to hud logs
  function appendLog(text, highlight = false) {
    const line = document.createElement('div');
    line.className = `analysis-status__log-line ${highlight ? 'highlight' : ''}`;
    line.textContent = `> ${text}`;
    logContainer.appendChild(line);
    
    // Auto-scroll logs
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  // Display resulting scorecard
  function showResults(type) {
    scoutFlow.classList.remove('analyzing');
    scoutFlow.classList.remove('active');
    scoutResults.classList.add('active');
    
    if (type === 'batting') {
      resultTitle.textContent = "Batting Technique Profile";
      resultScore.textContent = "84/100";
      
      const battingData = [
        { label: "Stance & Balance", score: 88 },
        { label: "Backlift & Swing", score: 82 },
        { label: "Footwork & Execution", score: 83 }
      ];
      
      applyMetricScores(battingData);
      
      verdictStrong.textContent = "Elite Cover Drive execution detected.";
      verdictText.textContent = "Excellent head positioning and foot movement. Stance holds optimal balance through contact point. Suggest pitching to UPCA academy trainers.";
    } else {
      resultTitle.textContent = "Bowling Action Profile";
      resultScore.textContent = "81/100";
      
      const bowlingData = [
        { label: "Run-up & Stride", score: 79 },
        { label: "Release Arm Speed", score: 85 },
        { label: "Follow-through", score: 80 }
      ];
      
      applyMetricScores(bowlingData);
      
      verdictStrong.textContent = "Consistent Outswing delivery path.";
      verdictText.textContent = "High release point with good wrist rotation and front-foot stability. Recommended development in seam position under specialized coaching.";
    }
  }

  // Apply visual bars for scorecard
  function applyMetricScores(data) {
    data.forEach((metric, index) => {
      if (index < metricBars.length) {
        // Label and value update
        const labelEl = metricBars[index].closest('.metric-row').querySelector('.metric-row__label');
        if (labelEl) labelEl.textContent = metric.label;
        
        metricValues[index].textContent = `${metric.score}%`;
        
        // Animated expansion
        metricBars[index].style.width = '0%';
        setTimeout(() => {
          metricBars[index].style.width = `${metric.score}%`;
        }, 100 + index * 100);
      }
    });
  }
  // Mobile Menu Toggle
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('nav__menu--open');
    });
  }
});
