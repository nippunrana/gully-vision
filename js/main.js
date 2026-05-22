document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const uploadCard = document.getElementById('upload-card');
  
  // Tab Switcher Elements
  const tabLocal = document.getElementById('tab-local');
  const tabYoutube = document.getElementById('tab-youtube');
  const localContainer = document.getElementById('local-container');
  const youtubeContainer = document.getElementById('youtube-container');
  const youtubeForm = document.getElementById('youtube-form');
  const youtubeUrlInput = document.getElementById('youtube-url-input');

  // Flow States
  const dropzoneState = document.getElementById('dropzone-state');
  const scoutFlow = document.getElementById('scout-flow');
  const scoutResults = document.getElementById('scout-results');
  const mediaContainer = document.getElementById('media-container');
  const heroGrid = document.querySelector('.hero__grid');
  const heroCopyColumn = document.getElementById('hero-copy-column');
  
  // Selector State Elements
  const selectorState = document.getElementById('selector-state');
  const selectorVideoPreview = document.getElementById('selector-video-preview');
  const selectorYoutubePlaceholder = document.getElementById('selector-youtube-placeholder');
  const selectorYoutubeHudText = document.getElementById('selector-youtube-hud-text');
  const clipStartSlider = document.getElementById('clip-start-slider');
  const clipStartVal = document.getElementById('clip-start-val');
  const clipRangeDisplay = document.getElementById('clip-range-display');
  const clipDurationSlider = document.getElementById('clip-duration-slider');
  const clipDurationVal = document.getElementById('clip-duration-val');
  const clipDurationDisplay = document.getElementById('clip-duration-display');
  const selectorBackBtn = document.getElementById('selector-back-btn');
  const selectorAnalyzeBtn = document.getElementById('selector-analyze-btn');
  
  // Dashboard Section
  const analysisDashboard = document.getElementById('analysis-dashboard');
  
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
  let selectedStart = 0;
  let selectedDuration = 12;
  let videoDuration = 12;
  let loadedSource = null;
  let loadedType = 'batting';

  let selectorYTPlayer = null;
  let dashboardYTPlayer = null;
  let ytLoopInterval = null;

  // Extract YouTube ID from any standard YouTube URL
  function getYoutubeId(url) {
    if (!url) return null;
    if (url.includes('mock-id')) return 'dQw4w9WgXcQ'; // Neutral fallback
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  // Initialize YouTube Iframe Player
  function initYoutubePlayer(containerId, videoId, onReady) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    container.innerHTML = '';
    const innerDiv = document.createElement('div');
    innerDiv.id = containerId + '-inner';
    container.appendChild(innerDiv);

    const createPlayer = () => {
      return new YT.Player(innerDiv.id, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          mute: 1,
          playsinline: 1
        },
        events: {
          onReady: (event) => {
            if (onReady) onReady(event.target);
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      return createPlayer();
    } else {
      // If YT API script isn't loaded yet, hook standard callback
      const existingCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (existingCallback) existingCallback();
        const activePlayer = createPlayer();
        if (containerId === 'selector-youtube-player-container') {
          selectorYTPlayer = activePlayer;
        } else if (containerId === 'dashboard-youtube-player-container') {
          dashboardYTPlayer = activePlayer;
        }
      };
      return null;
    }
  }

  // Monitor YouTube playback and loop within selected range
  function startYTLoopChecker(player) {
    if (ytLoopInterval) clearInterval(ytLoopInterval);
    
    ytLoopInterval = setInterval(() => {
      if (!player || typeof player.getCurrentTime !== 'function') return;
      
      let state = -1;
      try {
        state = player.getPlayerState();
      } catch (e) {
        return;
      }
      
      const currentTime = player.getCurrentTime() || 0;
      const duration = player.getDuration() || 0;
      
      if (player === selectorYTPlayer) {
        const overlay = document.getElementById('selector-time-overlay');
        if (overlay) {
          overlay.textContent = `${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s`;
        }
      }
      
      if (state === 1) { // PLAYING
        if (currentTime >= selectedStart + selectedDuration || currentTime < selectedStart) {
          player.seekTo(selectedStart, true);
        }
      }
    }, 200);
  }

  // Tab Switching Logic
  if (tabLocal && tabYoutube) {
    tabLocal.addEventListener('click', () => {
      tabLocal.classList.add('active');
      tabYoutube.classList.remove('active');
      localContainer.style.display = 'block';
      youtubeContainer.style.display = 'none';
      resetToUpload();
    });

    tabYoutube.addEventListener('click', () => {
      tabYoutube.classList.add('active');
      tabLocal.classList.remove('active');
      youtubeContainer.style.display = 'block';
      localContainer.style.display = 'none';
      resetToUpload();
    });
  }

  // Handle YouTube Form Submit
  if (youtubeForm) {
    youtubeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = youtubeUrlInput.value.trim();
      if (url) {
        handleYoutubeInput(url);
      }
    });
  }

  // Visual Setup - Drag and Drop Listeners
  if (uploadZone) {
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
  }

  // Handle file selection
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleVideoInput(e.target.files[0]);
      }
    });
  }

  // Handle sample video click
  sampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type');
      const videoSrc = btn.getAttribute('data-video');
      showSelectorView(videoSrc, type);
    });
  });

  // Handle resetting flow
  if (resetBtn) resetBtn.addEventListener('click', resetToUpload);
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (analysisInterval) clearInterval(analysisInterval);
      resetToUpload();
    });
  }

  // Selector Action Button Handlers
  if (clipStartSlider) {
    clipStartSlider.addEventListener('input', (e) => {
      updateRangeDisplay(e.target.value);
    });
  }

  if (clipDurationSlider) {
    clipDurationSlider.addEventListener('input', (e) => {
      selectedDuration = parseFloat(e.target.value);
      if (clipDurationVal) clipDurationVal.textContent = `${selectedDuration.toFixed(1)}s`;
      if (clipDurationDisplay) clipDurationDisplay.textContent = `${selectedDuration.toFixed(1)}s`;
      
      const maxStart = Math.max(0, videoDuration - selectedDuration);
      if (clipStartSlider) {
        clipStartSlider.max = maxStart;
        if (parseFloat(clipStartSlider.value) > maxStart) {
          clipStartSlider.value = maxStart;
          selectedStart = maxStart;
        }
      }
      updateRangeDisplay(selectedStart);
    });
  }

  if (selectorVideoPreview) {
    selectorVideoPreview.addEventListener('timeupdate', () => {
      const currentTime = selectorVideoPreview.currentTime || 0;
      const duration = selectorVideoPreview.duration || 0;
      const overlay = document.getElementById('selector-time-overlay');
      if (overlay) {
        overlay.textContent = `${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s`;
      }
    });
  }

  if (selectorBackBtn) {
    selectorBackBtn.addEventListener('click', resetToUpload);
  }

  if (selectorAnalyzeBtn) {
    selectorAnalyzeBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('player-name-input');
      const categorySelect = document.getElementById('analysis-category-select');
      const playerName = nameInput ? nameInput.value.trim() : 'Grassroots Prospect';
      const targetCategory = categorySelect ? categorySelect.value : loadedType;
      
      startRealAnalysis(loadedSource, targetCategory, playerName);
    });
  }

  // Process local file input
  function handleVideoInput(file) {
    if (!file.type.startsWith('video/')) {
      alert('Please upload a valid MP4 or MOV cricket video file.');
      return;
    }
    
    currentFile = file;
    
    // Auto-detect role based on file name triggers
    let detectedType = 'batting';
    const name = file.name.toLowerCase();
    if (name.includes('bowl') || name.includes('bowling') || name.includes('pitch') || name.includes('delivery')) {
      detectedType = 'bowling';
    }
    
    showSelectorView(file, detectedType);
  }

  // Process YouTube URL input
  function handleYoutubeInput(url) {
    // Auto-detect role based on URL contents or prompt triggers
    let detectedType = 'batting';
    const checkStr = url.toLowerCase();
    if (checkStr.includes('bowl') || checkStr.includes('bowling') || checkStr.includes('delivery')) {
      detectedType = 'bowling';
    }
    
    showSelectorView(url, detectedType);
  }

  // Trimmer segment selector helpers
  function showSelectorView(source, type) {
    loadedSource = source;
    loadedType = type;
    selectedStart = 0;
    selectedDuration = 12;
    
    if (clipDurationSlider) {
      clipDurationSlider.value = 12;
    }
    if (clipDurationVal) clipDurationVal.textContent = '12.0s';
    if (clipDurationDisplay) clipDurationDisplay.textContent = '12.0s';

    // Hide upload tabs and dropzone state
    if (tabLocal && tabLocal.parentNode) tabLocal.parentNode.style.display = 'none';
    if (dropzoneState) dropzoneState.style.display = 'none';
    if (selectorState) selectorState.style.display = 'block';
    
    const isUrl = typeof source === 'string';
    const isYoutube = isUrl && (source.includes('youtube.com') || source.includes('youtu.be') || source.includes('mock-id'));
    
    const selectorYtContainer = document.getElementById('selector-youtube-player-container');
    
    if (isYoutube) {
      if (selectorVideoPreview) selectorVideoPreview.style.display = 'none';
      if (selectorYoutubePlaceholder) selectorYoutubePlaceholder.style.display = 'none';
      if (selectorYtContainer) selectorYtContainer.style.display = 'block';
      
      const videoId = getYoutubeId(source) || 'dQw4w9WgXcQ';
      
      if (selectorYTPlayer && typeof selectorYTPlayer.destroy === 'function') {
        try { selectorYTPlayer.destroy(); } catch (e) {}
        selectorYTPlayer = null;
      }

      selectorYTPlayer = initYoutubePlayer('selector-youtube-player-container', videoId, (player) => {
        videoDuration = player.getDuration() || 60;
        const maxStart = Math.max(0, videoDuration - selectedDuration);
        if (clipStartSlider) {
          clipStartSlider.max = maxStart;
          clipStartSlider.value = 0;
        }
        updateRangeDisplay(0);
        startYTLoopChecker(player);
      });
      
      if (!selectorYTPlayer) {
        videoDuration = 60;
        if (clipStartSlider) {
          clipStartSlider.max = Math.max(0, videoDuration - selectedDuration);
          clipStartSlider.value = 0;
        }
        updateRangeDisplay(0);
      }
    } else {
      if (selectorVideoPreview) selectorVideoPreview.style.display = 'block';
      if (selectorYoutubePlaceholder) selectorYoutubePlaceholder.style.display = 'none';
      if (selectorYtContainer) selectorYtContainer.style.display = 'none';
      
      const srcUrl = isUrl ? source : URL.createObjectURL(source);
      if (selectorVideoPreview) {
        selectorVideoPreview.src = srcUrl;
        selectorVideoPreview.load();
        
        selectorVideoPreview.onloadedmetadata = () => {
          videoDuration = selectorVideoPreview.duration || 12;
          const maxStart = Math.max(0, videoDuration - selectedDuration);
          if (clipStartSlider) {
            clipStartSlider.max = maxStart;
            clipStartSlider.value = 0;
          }
          updateRangeDisplay(0);
        };
        
        selectorVideoPreview.play().catch(() => {});
      }
    }
  }

  function updateRangeDisplay(startVal) {
    selectedStart = parseFloat(startVal);
    if (clipStartVal) clipStartVal.textContent = `${selectedStart.toFixed(1)}s`;
    
    const endVal = selectedStart + selectedDuration;
    if (clipRangeDisplay) {
      clipRangeDisplay.textContent = `${selectedStart.toFixed(1)}s - ${endVal.toFixed(1)}s`;
    }
    
    const overlay = document.getElementById('selector-time-overlay');
    if (overlay && selectorVideoPreview && selectorVideoPreview.style.display !== 'none') {
      overlay.textContent = `${selectedStart.toFixed(1)}s / ${(selectorVideoPreview.duration || 0).toFixed(1)}s`;
    } else if (overlay && selectorYTPlayer && typeof selectorYTPlayer.getCurrentTime === 'function') {
      try {
        overlay.textContent = `${selectedStart.toFixed(1)}s / ${(selectorYTPlayer.getDuration() || 0).toFixed(1)}s`;
      } catch (e) {}
    }
    
    if (selectorVideoPreview && selectorVideoPreview.style.display !== 'none') {
      selectorVideoPreview.currentTime = selectedStart;
    }
    
    if (selectorYTPlayer && typeof selectorYTPlayer.seekTo === 'function') {
      try {
        selectorYTPlayer.seekTo(selectedStart, true);
      } catch (e) {}
    }
  }

  // Visual layout toggles
  function resetUploadCardOnly() {
    if (selectorState) selectorState.style.display = 'none';
    if (tabLocal && tabLocal.parentNode) tabLocal.parentNode.style.display = 'flex';
    if (dropzoneState) dropzoneState.style.display = 'block';
    
    if (selectorVideoPreview) {
      selectorVideoPreview.pause();
      selectorVideoPreview.src = '';
    }
    
    const selectorYtContainer = document.getElementById('selector-youtube-player-container');
    if (selectorYtContainer) selectorYtContainer.style.display = 'none';
    
    if (selectorYTPlayer && typeof selectorYTPlayer.destroy === 'function') {
      try { selectorYTPlayer.destroy(); } catch (e) {}
      selectorYTPlayer = null;
    }
    
    if (ytLoopInterval) {
      clearInterval(ytLoopInterval);
      ytLoopInterval = null;
    }
    
    if (fileInput) fileInput.value = '';
  }

  function showFlowState() {
    resetUploadCardOnly();
    
    if (analysisDashboard) analysisDashboard.style.display = 'block';
    if (mediaContainer) mediaContainer.style.display = 'block';
    if (scoutFlow) {
      scoutFlow.style.display = 'block';
      scoutFlow.classList.add('active');
      scoutFlow.classList.add('analyzing');
    }
    if (scoutResults) {
      scoutResults.style.display = 'none';
      scoutResults.classList.remove('active');
    }
    
    if (analysisDashboard) {
      analysisDashboard.scrollIntoView({ behavior: 'smooth' });
    }
    
    logContainer.innerHTML = '';
    progressBarFill.style.width = '0%';
    progressPct.textContent = '0%';
  }

  function resetToUpload() {
    selectedDuration = 12;
    if (clipDurationSlider) {
      clipDurationSlider.value = 12;
    }
    if (clipDurationVal) clipDurationVal.textContent = '12.0s';
    if (clipDurationDisplay) clipDurationDisplay.textContent = '12.0s';

    if (analysisDashboard) analysisDashboard.style.display = 'none';
    if (scoutFlow) {
      scoutFlow.style.display = 'none';
      scoutFlow.classList.remove('active');
      scoutFlow.classList.remove('analyzing');
    }
    if (scoutResults) {
      scoutResults.style.display = 'none';
      scoutResults.classList.remove('active');
    }
    if (mediaContainer) mediaContainer.style.display = 'none';
    
    if (selectorVideoPreview) {
      selectorVideoPreview.pause();
      selectorVideoPreview.src = '';
    }
    
    const selectorYtContainer = document.getElementById('selector-youtube-player-container');
    if (selectorYtContainer) selectorYtContainer.style.display = 'none';
    
    if (selectorYTPlayer && typeof selectorYTPlayer.destroy === 'function') {
      try { selectorYTPlayer.destroy(); } catch (e) {}
      selectorYTPlayer = null;
    }
    
    const dashboardYtContainer = document.getElementById('dashboard-youtube-player-container');
    if (dashboardYtContainer) dashboardYtContainer.style.display = 'none';
    
    if (dashboardYTPlayer && typeof dashboardYTPlayer.destroy === 'function') {
      try { dashboardYTPlayer.destroy(); } catch (e) {}
      dashboardYTPlayer = null;
    }
    
    if (ytLoopInterval) {
      clearInterval(ytLoopInterval);
      ytLoopInterval = null;
    }
    
    if (selectorState) selectorState.style.display = 'none';
    if (tabLocal && tabLocal.parentNode) tabLocal.parentNode.style.display = 'flex';
    if (dropzoneState) dropzoneState.style.display = 'block';
    
    if (videoPreview) {
      videoPreview.style.display = 'block';
      videoPreview.pause();
      videoPreview.src = '';
      videoPreview.ontimeupdate = null;
    }
    
    const ytPlaceholder = document.getElementById('youtube-preview-placeholder');
    if (ytPlaceholder) ytPlaceholder.style.display = 'none';
    
    if (analysisInterval) clearInterval(analysisInterval);
    currentFile = null;
    if (fileInput) fileInput.value = '';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Real API calling and progress bar coordination
  function startRealAnalysis(source, type, playerName = 'Grassroots Prospect') {
    const isUrl = typeof source === 'string';
    const isYoutube = isUrl && (source.includes('youtube.com') || source.includes('youtu.be') || source.includes('mock-id'));
    
    showFlowState();
    
    const dashboardYtContainer = document.getElementById('dashboard-youtube-player-container');
    
    if (isYoutube) {
      if (videoPreview) videoPreview.style.display = 'none';
      const ytPlaceholder = document.getElementById('youtube-preview-placeholder');
      if (ytPlaceholder) ytPlaceholder.style.display = 'none';
      if (dashboardYtContainer) dashboardYtContainer.style.display = 'block';
      
      const videoId = getYoutubeId(source) || 'dQw4w9WgXcQ';
      
      if (dashboardYTPlayer && typeof dashboardYTPlayer.destroy === 'function') {
        try { dashboardYTPlayer.destroy(); } catch (e) {}
        dashboardYTPlayer = null;
      }
      
      dashboardYTPlayer = initYoutubePlayer('dashboard-youtube-player-container', videoId, (player) => {
        player.seekTo(selectedStart, true);
        player.playVideo();
        startYTLoopChecker(player);
      });
    } else {
      if (dashboardYtContainer) dashboardYtContainer.style.display = 'none';
      videoPreview.style.display = 'block';
      const ytPlaceholder = document.getElementById('youtube-preview-placeholder');
      if (ytPlaceholder) ytPlaceholder.style.display = 'none';
      
      const srcUrl = typeof source === 'string' ? source : URL.createObjectURL(source);
      videoPreview.src = srcUrl;
      videoPreview.load();
      videoPreview.currentTime = selectedStart;
      videoPreview.play().catch(() => {});
      
      videoPreview.ontimeupdate = () => {
        if (videoPreview.currentTime >= selectedStart + selectedDuration || videoPreview.currentTime < selectedStart) {
          videoPreview.currentTime = selectedStart;
        }
      };
    }

    // Interactive progress logger timeline
    let progress = 0;
    let logIndex = 0;
    const pipelineLogs = [
      { progress: 2, text: "Initializing Gully-Vision Video Pipeline..." },
      { progress: 10, text: "Routing request to secure PHP gateway..." },
      { progress: 20, text: isYoutube ? "Initiating remote video transcoding..." : "Uploading local media chunks to Google File API..." },
      { progress: 38, text: "Verifying video format metadata & duration..." },
      { progress: 50, text: "Spawning Gemini 3.5 Flash Scouting Agent..." },
      { progress: 65, text: "Extracting biomechanical joint tracking landmarks..." },
      { progress: 80, text: "Calculating techniques & execution percentages..." },
      { progress: 90, text: "Drafting selector outreach pitches & compilation..." }
    ];

    progressBarFill.style.width = '0%';
    progressPct.textContent = '0%';
    appendLog(pipelineLogs[0].text, true);
    logIndex++;

    // Increment progress bar up to 95% gradually
    analysisInterval = setInterval(() => {
      if (progress < 95) {
        const increment = progress < 40 ? 2 : (progress < 75 ? 1 : 0.2);
        progress += increment;
        if (progress > 95) progress = 95;
        
        const roundedProgress = Math.floor(progress);
        progressBarFill.style.width = `${roundedProgress}%`;
        progressPct.textContent = `${roundedProgress}%`;
        
        if (logIndex < pipelineLogs.length && roundedProgress >= pipelineLogs[logIndex].progress) {
          const log = pipelineLogs[logIndex];
          const isHighlight = log.progress === 50 || log.progress === 80;
          appendLog(log.text, isHighlight);
          logIndex++;
        }
      }
    }, 120);

    // Call frontend API client
    const apiCall = isYoutube 
      ? window.GullyVisionAPI.analyzeYoutubeUrl(source, type, playerName)
      : (typeof source === 'string' 
          ? window.GullyVisionAPI.analyzeYoutubeUrl(source, type, playerName) // Treat remote sample URLs same as direct links
          : window.GullyVisionAPI.analyzeVideoFile(source, type, playerName));

    apiCall.then((data) => {
      clearInterval(analysisInterval);
      
      // Jump progress to completion
      progressBarFill.style.width = '100%';
      progressPct.textContent = '100%';
      appendLog("Analysis Complete! Loading scorecard dashboard...", true);
      
      setTimeout(() => {
        showRealResults(data);
        loadLeaderboard();
      }, 700);
    }).catch((err) => {
      clearInterval(analysisInterval);
      progressBarFill.style.width = '0%';
      progressPct.textContent = '0%';
      appendLog(`Error: ${err.message || 'Analysis processing failed.'}`, false);
      appendLog("Verify your .env API credentials and try again.", true);
      
      alert(`Scouting Pipeline Error:\n${err.message || 'Check network connection and server settings.'}`);
      resetToUpload();
    });
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

  // Display resulting scorecard from real API response
  function showRealResults(data) {
    if (analysisDashboard) {
      analysisDashboard.style.display = 'block';
    }
    if (scoutFlow) {
      scoutFlow.style.display = 'none';
      scoutFlow.classList.remove('analyzing');
      scoutFlow.classList.remove('active');
    }
    if (scoutResults) {
      scoutResults.style.display = 'flex';
      scoutResults.classList.add('active');
    }
    
    // Smooth scroll down to analysis dashboard
    if (analysisDashboard) {
      analysisDashboard.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Handle error returned in JSON payload
    if (data.error) {
      if (resultTitle) resultTitle.textContent = "Analysis Error";
      resultScore.textContent = "--/100";
      verdictStrong.textContent = "Error occurred during analysis.";
      verdictText.textContent = data.error;
      applyMetricScores([
        { label: "Stance & Balance", score: 0 },
        { label: "Backlift & Swing", score: 0 },
        { label: "Execution Accuracy", score: 0 }
      ]);
      return;
    }

    const role = (data.scouted_player && data.scouted_player.role) || 'Batter';
    const playerName = (data.scouted_player && data.scouted_player.name) || 'Grassroots Prospect';
    const playerStyle = (data.scouted_player && data.scouted_player.player_style) || 'Unknown Style';
    const techName = (data.shot_or_delivery_name && data.shot_or_delivery_name.technical) || 'Unknown';
    const colloquialName = (data.shot_or_delivery_name && data.shot_or_delivery_name.colloquial) || 'Unknown';
    
    let metrics = [];
    let title = "";
    let overallScore = 0;
    
    if (role === 'Bowler') {
      title = "Bowling Action Profile";
      const bowlingScores = (data.dashboard_metrics && data.dashboard_metrics.bowling_scores) || {};
      const runUp = bowlingScores.run_up_and_stride !== null ? bowlingScores.run_up_and_stride : 80;
      const armSpeed = bowlingScores.release_arm_speed !== null ? bowlingScores.release_arm_speed : 80;
      const follow = bowlingScores.follow_through !== null ? bowlingScores.follow_through : 80;
      
      metrics = [
        { label: "Run-up & Stride", score: runUp },
        { label: "Release Arm Speed", score: armSpeed },
        { label: "Follow-through", score: follow }
      ];
      overallScore = Math.round((runUp + armSpeed + follow) / 3);
    } else if (role === 'Fielder') {
      title = "Fielding Technique Profile";
      const fieldingScores = (data.dashboard_metrics && data.dashboard_metrics.fielding_scores) || {};
      const throwing = fieldingScores.throwing_accuracy !== null ? fieldingScores.throwing_accuracy : 80;
      const coverage = fieldingScores.ground_coverage !== null ? fieldingScores.ground_coverage : 80;
      const catching = fieldingScores.catching_technique !== null ? fieldingScores.catching_technique : 80;
      
      metrics = [
        { label: "Throwing Accuracy", score: throwing },
        { label: "Ground Coverage", score: coverage },
        { label: "Catching Technique", score: catching }
      ];
      overallScore = Math.round((throwing + coverage + catching) / 3);
    } else {
      title = "Batting Technique Profile";
      const battingScores = (data.dashboard_metrics && data.dashboard_metrics.batting_scores) || {};
      const stance = battingScores.stance_and_balance !== null ? battingScores.stance_and_balance : 80;
      const backlift = battingScores.backlift_and_swing !== null ? battingScores.backlift_and_swing : 80;
      const execution = battingScores.footwork_and_execution !== null ? battingScores.footwork_and_execution : 80;
      
      metrics = [
        { label: "Stance & Balance", score: stance },
        { label: "Backlift & Swing", score: backlift },
        { label: "Footwork & Execution", score: execution }
      ];
      overallScore = Math.round((stance + backlift + execution) / 3);
    }
    
    // Bind identity fields
    if (resultTitle) resultTitle.textContent = title;
    resultScore.textContent = `${overallScore}/100`;
    
    const playerNameEl = document.getElementById('result-player-name');
    if (playerNameEl) playerNameEl.textContent = playerName;
    
    const playerStyleEl = document.getElementById('result-player-style');
    if (playerStyleEl) playerStyleEl.textContent = `${role} • ${playerStyle}`;
    
    applyMetricScores(metrics);
    
    verdictStrong.textContent = `${techName} (${colloquialName}) detected.`;
    
    const feedback = data.evaluation_and_feedback || {};
    const summary = feedback.scouting_summary || 'Analysis completed successfully.';
    const suggestion = feedback.actionable_suggestion || '';
    verdictText.textContent = `${summary} ${suggestion}`;
    
    // Bind detailed biomechanical telemetry fields
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || 'Unknown';
    };
    
    const bio = data.biomechanics_impact || {};
    setText('val-trigger', bio.trigger_movement_or_stride);
    setText('val-head', bio.head_alignment);
    setText('val-contact', bio.contact_or_release_quality);
    setText('val-angle', bio.launch_or_release_angle);
    
    // Bind delivery analytics fields
    const deliv = data.delivery_data || {};
    setText('val-length', deliv.length);
    setText('val-line', deliv.line);
    setText('val-deviation', deliv.deviation);
    
    // Bind outcome
    const outcome = data.outcome_stats || {};
    const controlStatus = outcome.control_status || 'Unknown';
    const visibleResult = outcome.visible_result || 'Unknown';
    setText('val-control', `${controlStatus} / ${visibleResult}`);
    
    // Bind pitch hook
    const pitchHook = feedback.outreach_pitch_hook || 'Elite technique spotted in Lucknow nets.';
    const pitchHookTextEl = document.getElementById('pitch-hook-text');
    if (pitchHookTextEl) pitchHookTextEl.textContent = `"${pitchHook}"`;
    
    // Populate Strengths, Improvements, and Observations lists
    const populateList = (elementId, items) => {
      const el = document.getElementById(elementId);
      if (!el) return;
      el.innerHTML = '';
      if (items && Array.isArray(items) && items.length > 0) {
        items.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item;
          el.appendChild(li);
        });
      } else {
        const li = document.createElement('li');
        li.textContent = 'None observed';
        el.appendChild(li);
      }
    };
    
    populateList('key-strengths-list', feedback.key_strengths || []);
    populateList('areas-to-improve-list', feedback.areas_to_improve || []);
    populateList('observations-list', data.observations || []);
    
    // Bind outreach button to pitch hook dynamically
    const outreachBtn = document.getElementById('outreach-btn');
    if (outreachBtn) {
      outreachBtn.onclick = () => {
        const emailBody = `Respected Selectors,\n\nI would like to recommend ${playerName} for your review. Biomechanical scouting results:\n\nRole: ${role}\nAction: ${techName} (${colloquialName})\nOverall Rating: ${overallScore}/100\n\nScout Pitch:\n"${pitchHook}"\n\nRegards,\nGully-Vision Agent`;
        alert(`Selector Outreach Triggered!\n\nPitch Hook Sent:\n"${pitchHook}"\n\nDraft Email Content:\n\n${emailBody}`);
      };
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

  // Leaderboard Initialisation and Binding
  const ctaViewDashboard = document.getElementById('cta-view-dashboard');
  const leaderboardSection = document.getElementById('leaderboard-section');
  const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');
  const btnRankRating = document.getElementById('rank-by-rating');
  const btnRankScore = document.getElementById('rank-by-score');
  
  if (ctaViewDashboard) {
    ctaViewDashboard.addEventListener('click', (e) => {
      e.preventDefault();
      if (leaderboardSection) {
        loadLeaderboard();
        leaderboardSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
  
  if (closeLeaderboardBtn) {
    closeLeaderboardBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (btnRankRating && btnRankScore) {
    btnRankRating.addEventListener('click', () => {
      loadLeaderboard('rating');
    });
    btnRankScore.addEventListener('click', () => {
      loadLeaderboard('score');
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function viewPlayerAnalysis(playerId) {
    fetch(`api/leaderboard.php?player_id=${playerId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error("Detailed analysis data is not available for this prospect.");
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          showRealResults(data);
        }
      })
      .catch(err => {
        alert(err.message || "Failed to load player analysis.");
      });
  }

  let currentSort = 'rating';

  function loadLeaderboard(sortType) {
    if (sortType) {
      currentSort = sortType;
    }
    
    // update buttons state visually
    const btnRating = document.getElementById('rank-by-rating');
    const btnScore = document.getElementById('rank-by-score');
    if (btnRating && btnScore) {
      if (currentSort === 'rating') {
        btnRating.classList.add('active');
        btnScore.classList.remove('active');
      } else {
        btnScore.classList.add('active');
        btnRating.classList.remove('active');
      }
    }

    fetch(`api/leaderboard.php?sort=${currentSort}`)
      .then(res => res.json())
      .then(data => {
        const tbody = document.getElementById('leaderboard-rows');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (!data || data.length === 0 || data.error) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" style="padding: var(--space-6); text-align: center; color: var(--color-text-muted);">No players scouted yet. Be the first to analyze!</td>
            </tr>
          `;
          return;
        }
        
        data.forEach((row, index) => {
          const tr = document.createElement('tr');
          tr.style.cssText = "border-bottom: 1px solid var(--color-border-glass); font-size: var(--text-sm); color: #fff; transition: background 0.2s;";
          tr.addEventListener('mouseenter', () => tr.style.background = 'hsla(140, 100%, 10%, 0.15)');
          tr.addEventListener('mouseleave', () => tr.style.background = 'transparent');
          
          let medal = index + 1;
          if (index === 0) medal = '🥇';
          else if (index === 1) medal = '🥈';
          else if (index === 2) medal = '🥉';
          
          const ratingColor = row.overall_score >= 85 ? 'var(--color-green)' : (row.overall_score >= 70 ? 'var(--color-gold)' : 'var(--color-text-secondary)');
          const scoreColor = row.total_score >= 255 ? 'var(--color-green)' : (row.total_score >= 210 ? 'var(--color-gold)' : 'var(--color-text-secondary)');
          
          const nameHtml = `<span class="player-name-link">${escapeHtml(row.player_name)}</span>`;
          
          tr.innerHTML = `
            <td style="padding: var(--space-4); font-weight: bold; font-size: var(--text-base);">${medal}</td>
            <td style="padding: var(--space-4); font-weight: 600;">${nameHtml}</td>
            <td style="padding: var(--space-4);"><span class="badge" style="background: hsla(220, 20%, 20%, 0.6);">${escapeHtml(row.role)}</span></td>
            <td style="padding: var(--space-4); color: var(--color-text-secondary);">${escapeHtml(row.technique_name)}</td>
            <td style="padding: var(--space-4); text-align: right; font-weight: bold; color: ${ratingColor};">${row.overall_score}/100</td>
            <td style="padding: var(--space-4); text-align: right; font-weight: bold; color: ${scoreColor};">${row.total_score}/300</td>
            <td style="padding: var(--space-4); color: var(--color-text-muted); font-size: var(--text-xs);">${new Date(row.scouted_at).toLocaleDateString()}</td>
          `;
          tbody.appendChild(tr);
          
          const playerLink = tr.querySelector('.player-name-link');
          if (playerLink) {
            playerLink.addEventListener('click', (e) => {
              e.preventDefault();
              viewPlayerAnalysis(row.id);
            });
          }
        });
      })
      .catch(err => {
        console.error("Failed to load leaderboard:", err);
      });
  }

  // Pre-load the leaderboard structure
  loadLeaderboard();
});

