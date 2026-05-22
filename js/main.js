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
  let videoDuration = 12;
  let loadedSource = null;
  let loadedType = 'batting';

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

  if (selectorBackBtn) {
    selectorBackBtn.addEventListener('click', resetToUpload);
  }

  if (selectorAnalyzeBtn) {
    selectorAnalyzeBtn.addEventListener('click', () => {
      startRealAnalysis(loadedSource, loadedType);
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
    
    // Hide upload tabs and dropzone state
    if (tabLocal && tabLocal.parentNode) tabLocal.parentNode.style.display = 'none';
    if (dropzoneState) dropzoneState.style.display = 'none';
    if (selectorState) selectorState.style.display = 'block';
    
    const isUrl = typeof source === 'string';
    const isYoutube = isUrl && (source.includes('youtube.com') || source.includes('youtu.be') || source.includes('mock-id'));
    
    if (isYoutube) {
      if (selectorVideoPreview) selectorVideoPreview.style.display = 'none';
      if (selectorYoutubePlaceholder) selectorYoutubePlaceholder.style.display = 'flex';
      if (selectorYoutubeHudText) selectorYoutubeHudText.textContent = source;
      
      videoDuration = 60;
      if (clipStartSlider) {
        clipStartSlider.max = 48; // Max start is 48s for a 12s window out of 60s
        clipStartSlider.value = 0;
      }
      updateRangeDisplay(0);
    } else {
      if (selectorVideoPreview) selectorVideoPreview.style.display = 'block';
      if (selectorYoutubePlaceholder) selectorYoutubePlaceholder.style.display = 'none';
      
      const srcUrl = isUrl ? source : URL.createObjectURL(source);
      if (selectorVideoPreview) {
        selectorVideoPreview.src = srcUrl;
        selectorVideoPreview.load();
        
        selectorVideoPreview.onloadedmetadata = () => {
          videoDuration = selectorVideoPreview.duration || 12;
          const maxStart = Math.max(0, videoDuration - 12);
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
    
    const endVal = selectedStart + 12;
    if (clipRangeDisplay) {
      clipRangeDisplay.textContent = `${selectedStart.toFixed(1)}s - ${endVal.toFixed(1)}s`;
    }
    
    if (selectorVideoPreview && selectorVideoPreview.style.display !== 'none') {
      selectorVideoPreview.currentTime = selectedStart;
    }
  }

  // Visual layout toggles
  function showFlowState() {
    // Hide selector state
    if (selectorState) selectorState.style.display = 'none';
    
    // Show analysis dashboard and media container/flow logs
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
    
    // Smooth scroll down to analysis dashboard
    if (analysisDashboard) {
      analysisDashboard.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Clear logs
    logContainer.innerHTML = '';
    progressBarFill.style.width = '0%';
    progressPct.textContent = '0%';
  }

  function resetToUpload() {
    // Hide analysis dashboard
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
    
    // Reset selector preview video
    if (selectorVideoPreview) {
      selectorVideoPreview.pause();
      selectorVideoPreview.src = '';
    }
    
    // Reset upload elements
    if (selectorState) selectorState.style.display = 'none';
    if (tabLocal && tabLocal.parentNode) tabLocal.parentNode.style.display = 'flex';
    if (dropzoneState) dropzoneState.style.display = 'block';
    
    // Reset video player
    if (videoPreview) {
      videoPreview.style.display = 'block';
      videoPreview.pause();
      videoPreview.src = '';
      videoPreview.ontimeupdate = null;
    }
    
    // Reset YouTube placeholder
    const ytPlaceholder = document.getElementById('youtube-preview-placeholder');
    if (ytPlaceholder) ytPlaceholder.style.display = 'none';
    
    if (analysisInterval) clearInterval(analysisInterval);
    currentFile = null;
    if (fileInput) fileInput.value = '';
    
    // Scroll back to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Real API calling and progress bar coordination
  function startRealAnalysis(source, type) {
    const isUrl = typeof source === 'string';
    const isYoutube = isUrl && (source.includes('youtube.com') || source.includes('youtu.be') || source.includes('mock-id'));
    
    // Show flow state UI
    showFlowState();
    
    // Setup player view HUD
    if (isYoutube) {
      // Hide video tag and show nice graphic placeholder for URL stream
      videoPreview.style.display = 'none';
      let ytPlaceholder = document.getElementById('youtube-preview-placeholder');
      if (!ytPlaceholder) {
        ytPlaceholder = document.createElement('div');
        ytPlaceholder.id = 'youtube-preview-placeholder';
        ytPlaceholder.className = 'youtube-preview-placeholder';
        ytPlaceholder.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 10px; padding: 20px; text-align: center;">
            <svg fill="currentColor" viewBox="0 0 24 24" width="48" height="48" style="color: #ff0000; filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.45));">
              <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span style="font-family: var(--font-display); font-size: 13px; font-weight: 600; color: var(--color-text-secondary);">Streaming Video Target</span>
            <span style="font-family: monospace; font-size: 9px; color: var(--color-text-muted); word-break: break-all;" id="youtube-url-hud-text"></span>
          </div>
        `;
        ytPlaceholder.style.cssText = "position: absolute; inset: 0; background: #000; z-index: 1;";
        videoPreview.parentNode.appendChild(ytPlaceholder);
      }
      ytPlaceholder.style.display = 'block';
      const hudText = document.getElementById('youtube-url-hud-text');
      if (hudText) hudText.textContent = source;
    } else {
      // Local file or direct video URL preview play
      videoPreview.style.display = 'block';
      const ytPlaceholder = document.getElementById('youtube-preview-placeholder');
      if (ytPlaceholder) ytPlaceholder.style.display = 'none';
      
      const srcUrl = typeof source === 'string' ? source : URL.createObjectURL(source);
      videoPreview.src = srcUrl;
      videoPreview.load();
      videoPreview.currentTime = selectedStart;
      videoPreview.play().catch(() => {});
      
      // Keep video looping within the 12-second window
      videoPreview.ontimeupdate = () => {
        if (videoPreview.currentTime >= selectedStart + 12 || videoPreview.currentTime < selectedStart) {
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
      ? window.GullyVisionAPI.analyzeYoutubeUrl(source, type)
      : (typeof source === 'string' 
          ? window.GullyVisionAPI.analyzeYoutubeUrl(source, type) // Treat remote sample URLs same as direct links
          : window.GullyVisionAPI.analyzeVideoFile(source, type));

    apiCall.then((data) => {
      clearInterval(analysisInterval);
      
      // Jump progress to completion
      progressBarFill.style.width = '100%';
      progressPct.textContent = '100%';
      appendLog("Analysis Complete! Loading scorecard dashboard...", true);
      
      setTimeout(() => {
        showRealResults(data);
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
});

