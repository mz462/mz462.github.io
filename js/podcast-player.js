/**
 * Podcast Floating Mini-Bar Player
 * A sitewide audio player for MJ's Blog
 */

(function () {
  "use strict";

  // ============================================
  // PLAYLIST (placeholder R2 URLs)
  // ============================================

  var R2_BASE = "https://pub-64eca94564a64eef9d486ccb65cea4a4.r2.dev";

  var PLAYLIST = [
    {
      id: "2026-02-09",
      title: "AI Pulse - Feb 9, 2026",
      description: "AI Pulse daily briefing",
      src: R2_BASE + "/episodes/2026-02-09/ai-pulse-2026-02-09.mp3",
      transcript: R2_BASE + "/episodes/2026-02-09/ai-pulse-2026-02-09.srt",
      duration: "--:--",
    },
    {
      id: "2026-02-08",
      title: "AI Pulse - Feb 8, 2026",
      description: "AI Pulse daily briefing",
      src: R2_BASE + "/episodes/2026-02-08/ai-pulse-2026-02-08.mp3",
      transcript: R2_BASE + "/episodes/2026-02-08/ai-pulse-2026-02-08.srt",
      duration: "--:--",
    },
    {
      id: "2026-02-07",
      title: "AI Pulse - Feb 7, 2026",
      description: "AI Pulse daily briefing",
      src: R2_BASE + "/episodes/2026-02-07/ai-pulse-2026-02-07.mp3",
      transcript: R2_BASE + "/episodes/2026-02-07/ai-pulse-2026-02-07.srt",
      duration: "--:--",
    },
    {
      id: "2026-02-06",
      title: "AI Pulse - Feb 6, 2026",
      description: "AI Pulse daily briefing",
      src: R2_BASE + "/episodes/2026-02-06/ai-pulse-2026-02-06.mp3",
      transcript: R2_BASE + "/episodes/2026-02-06/ai-pulse-2026-02-06.srt",
      duration: "--:--",
    },
  ];

  // ============================================
  // SVG ICONS
  // ============================================

  var ICONS = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>',
    volume: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    muted: '<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
    playlist: '<svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>',
    minimize: '<svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>',
    expand: '<svg viewBox="0 0 24 24"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>',
    musicNote: '<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>',
    transcript: '<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z"/></svg>',
  };

  // ============================================
  // STATE
  // ============================================

  var STORAGE_KEY = "podcast-player";
  var audio = null;
  var currentIndex = 0;
  var isPlaying = false;
  var isMinimized = false;
  var isPlaylistOpen = false;
  var volume = 0.8;
  var isMuted = false;
  var rafId = null;
  var isTranscriptOpen = false;
  var transcriptCues = [];       // [{start, end, text}]
  var activeCueIndex = -1;
  var transcriptAutoScroll = true;
  var transcriptScrollTimer = null;
  var transcriptGeneration = 0;

  // ============================================
  // SRT PARSER
  // ============================================

  function parseSRTTimestamp(ts) {
    // "HH:MM:SS,mmm" or "HH:MM:SS.mmm"
    var parts = ts.replace(",", ".").split(":");
    var h = parseFloat(parts[0]) || 0;
    var m = parseFloat(parts[1]) || 0;
    var s = parseFloat(parts[2]) || 0;
    return h * 3600 + m * 60 + s;
  }

  function parseSRT(text) {
    var cues = [];
    var blocks = text.trim().replace(/\r\n/g, "\n").split(/\n\n+/);
    for (var i = 0; i < blocks.length; i++) {
      var lines = blocks[i].trim().split("\n");
      // Find the timestamp line (contains " --> ")
      for (var j = 0; j < lines.length; j++) {
        if (lines[j].indexOf(" --> ") !== -1) {
          var times = lines[j].split(" --> ");
          var start = parseSRTTimestamp(times[0].trim());
          var end = parseSRTTimestamp(times[1].trim());
          var textLines = lines.slice(j + 1);
          if (textLines.length > 0) {
            cues.push({ start: start, end: end, text: textLines.join(" ").replace(/<[^>]+>/g, "") });
          }
          break;
        }
      }
    }
    return cues;
  }

  function fetchTranscript(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function () {
      if (xhr.status === 200) {
        callback(parseSRT(xhr.responseText));
      } else {
        callback(null);
      }
    };
    xhr.onerror = function () {
      console.warn("Podcast: Failed to fetch transcript (network error)", url);
      callback(null);
    };
    xhr.send();
  }

  // ============================================
  // PERSISTENCE
  // ============================================

  function loadState() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var s = JSON.parse(saved);
        if (typeof s.currentIndex === "number" && s.currentIndex >= 0 && s.currentIndex < PLAYLIST.length) {
          currentIndex = s.currentIndex;
        }
        if (typeof s.volume === "number") volume = s.volume;
        if (typeof s.isMinimized === "boolean") isMinimized = s.isMinimized;
        if (typeof s.isMuted === "boolean") isMuted = s.isMuted;
        if (typeof s.isTranscriptOpen === "boolean") isTranscriptOpen = s.isTranscriptOpen;
        // currentTime restored after audio loads
        return s;
      }
    } catch (e) {
      console.warn("Podcast: Could not load state", e);
    }
    return null;
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentIndex: currentIndex,
          currentTime: audio ? audio.currentTime : 0,
          volume: volume,
          isMinimized: isMinimized,
          isMuted: isMuted,
          isTranscriptOpen: isTranscriptOpen,
        })
      );
    } catch (e) {
      console.warn("Podcast: Could not save state", e);
    }
  }

  // ============================================
  // DOM CREATION
  // ============================================

  function createPlayer() {
    // Audio element
    audio = new Audio();
    audio.preload = "metadata";
    audio.volume = isMuted ? 0 : volume;

    // Bottom bar
    var bar = document.createElement("div");
    bar.className = "podcast-bar" + (isMinimized ? " hidden" : "");
    bar.id = "podcast-bar";
    bar.innerHTML =
      '<div class="podcast-bar-main">' +
        '<div class="podcast-controls">' +
          '<button class="podcast-btn podcast-btn-prev" title="Previous">' + ICONS.prev + "</button>" +
          '<button class="podcast-btn podcast-btn-play" title="Play">' + ICONS.play + "</button>" +
          '<button class="podcast-btn podcast-btn-next" title="Next">' + ICONS.next + "</button>" +
        "</div>" +
        '<div class="podcast-track-info">' +
          '<div class="podcast-track-title" id="podcast-title">' + escapeHtml(PLAYLIST[currentIndex].title) + "</div>" +
          '<div class="podcast-track-desc" id="podcast-desc">' + escapeHtml(PLAYLIST[currentIndex].description) + "</div>" +
        "</div>" +
        '<div class="podcast-progress-wrap">' +
          '<span class="podcast-time" id="podcast-current">0:00</span>' +
          '<div class="podcast-progress" id="podcast-progress">' +
            '<div class="podcast-progress-fill" id="podcast-fill">' +
              '<div class="podcast-progress-thumb"></div>' +
            "</div>" +
          "</div>" +
          '<span class="podcast-time" id="podcast-duration">' + PLAYLIST[currentIndex].duration + "</span>" +
        "</div>" +
        '<div class="podcast-volume-wrap">' +
          '<button class="podcast-btn podcast-btn-volume" title="Volume">' + (isMuted ? ICONS.muted : ICONS.volume) + "</button>" +
          '<input type="range" class="podcast-volume-slider" id="podcast-volume" min="0" max="1" step="0.01" value="' + (isMuted ? 0 : volume) + '">' +
        "</div>" +
        '<div class="podcast-actions">' +
          '<button class="podcast-btn podcast-btn-transcript" title="Transcript" style="display:none">' + ICONS.transcript + "</button>" +
          '<button class="podcast-btn podcast-btn-playlist" title="Playlist">' + ICONS.playlist + "</button>" +
          '<button class="podcast-btn podcast-btn-minimize" title="Minimize">' + ICONS.minimize + "</button>" +
        "</div>" +
      "</div>" +
      '<div class="podcast-subtitle" id="podcast-subtitle"></div>';

    // Playlist popup
    var playlist = document.createElement("div");
    playlist.className = "podcast-playlist";
    playlist.id = "podcast-playlist";
    playlist.innerHTML = buildPlaylistHTML();

    // Transcript panel
    var transcriptPanel = document.createElement("div");
    transcriptPanel.className = "podcast-transcript";
    transcriptPanel.id = "podcast-transcript";
    transcriptPanel.innerHTML =
      '<div class="podcast-transcript-header">' +
        '<span class="podcast-transcript-title">Transcript</span>' +
      "</div>" +
      '<div class="podcast-transcript-cues" id="podcast-transcript-cues"></div>';

    // Minimized pill
    var pill = document.createElement("div");
    pill.className = "podcast-pill" + (isMinimized ? " visible" : "");
    pill.id = "podcast-pill";
    pill.innerHTML =
      '<div class="podcast-pill-play">' + ICONS.play + "</div>" +
      '<span class="podcast-pill-title" id="podcast-pill-title">' + escapeHtml(PLAYLIST[currentIndex].title) + "</span>";

    document.body.appendChild(playlist);
    document.body.appendChild(transcriptPanel);
    document.body.appendChild(bar);
    document.body.appendChild(pill);

    if (!isMinimized) {
      document.body.classList.add("podcast-active");
    }

    bindEvents(bar, playlist, transcriptPanel, pill);
    loadTrack(currentIndex, false);
  }

  function buildPlaylistHTML() {
    var html =
      '<div class="podcast-playlist-header">' +
        '<span class="podcast-playlist-title">Playlist</span>' +
      "</div>" +
      '<div class="podcast-playlist-items">';

    for (var i = 0; i < PLAYLIST.length; i++) {
      var ep = PLAYLIST[i];
      var active = i === currentIndex ? " active" : "";
      html +=
        '<div class="podcast-playlist-item' + active + '" data-index="' + i + '">' +
          '<div class="podcast-playlist-item-icon">' +
            (i === currentIndex ? ICONS.musicNote : ICONS.play) +
          "</div>" +
          '<div class="podcast-playlist-item-info">' +
            '<div class="podcast-playlist-item-title">' + escapeHtml(ep.title) + "</div>" +
            '<div class="podcast-playlist-item-desc">' + escapeHtml(ep.description) + "</div>" +
          "</div>" +
          '<span class="podcast-playlist-item-duration">' + ep.duration + "</span>" +
        "</div>";
    }

    html += "</div>";
    return html;
  }

  // ============================================
  // EVENT BINDING
  // ============================================

  function bindEvents(bar, playlist, transcriptPanel, pill) {
    // Play/Pause
    bar.querySelector(".podcast-btn-play").addEventListener("click", togglePlay);

    // Prev/Next
    bar.querySelector(".podcast-btn-prev").addEventListener("click", function () {
      playIndex((currentIndex - 1 + PLAYLIST.length) % PLAYLIST.length);
    });
    bar.querySelector(".podcast-btn-next").addEventListener("click", function () {
      playIndex((currentIndex + 1) % PLAYLIST.length);
    });

    // Seek
    var progressBar = bar.querySelector("#podcast-progress");
    progressBar.addEventListener("click", function (e) {
      if (!audio.duration) return;
      var rect = progressBar.getBoundingClientRect();
      var pct = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pct * audio.duration;
      updateProgress();
      saveState();
    });

    // Volume slider
    var volSlider = bar.querySelector("#podcast-volume");
    volSlider.addEventListener("input", function () {
      volume = parseFloat(volSlider.value);
      isMuted = volume === 0;
      audio.volume = volume;
      updateVolumeIcon();
      saveState();
    });

    // Mute toggle
    bar.querySelector(".podcast-btn-volume").addEventListener("click", function () {
      isMuted = !isMuted;
      audio.volume = isMuted ? 0 : volume;
      volSlider.value = isMuted ? 0 : volume;
      updateVolumeIcon();
      saveState();
    });

    // Playlist toggle (mutual exclusion with transcript)
    bar.querySelector(".podcast-btn-playlist").addEventListener("click", function () {
      if (isTranscriptOpen) {
        isTranscriptOpen = false;
        transcriptPanel.classList.remove("open");
        bar.querySelector(".podcast-btn-transcript").classList.remove("active");
      }
      isPlaylistOpen = !isPlaylistOpen;
      playlist.classList.toggle("open", isPlaylistOpen);
    });

    // Playlist item click
    playlist.addEventListener("click", function (e) {
      var item = e.target.closest(".podcast-playlist-item");
      if (item) {
        var idx = parseInt(item.getAttribute("data-index"), 10);
        playIndex(idx);
        isPlaylistOpen = false;
        playlist.classList.remove("open");
      }
    });

    // Transcript toggle (mutual exclusion with playlist)
    bar.querySelector(".podcast-btn-transcript").addEventListener("click", function () {
      if (isPlaylistOpen) {
        isPlaylistOpen = false;
        playlist.classList.remove("open");
      }
      isTranscriptOpen = !isTranscriptOpen;
      transcriptPanel.classList.toggle("open", isTranscriptOpen);
      bar.querySelector(".podcast-btn-transcript").classList.toggle("active", isTranscriptOpen);
      if (isTranscriptOpen) {
        transcriptAutoScroll = true;
        scrollToActiveCue();
      }
      saveState();
    });

    // Click-to-seek on transcript cues
    transcriptPanel.addEventListener("click", function (e) {
      var cueEl = e.target.closest(".podcast-transcript-cue");
      if (cueEl && audio.duration) {
        var idx = parseInt(cueEl.getAttribute("data-index"), 10);
        if (idx >= 0 && idx < transcriptCues.length) {
          audio.currentTime = transcriptCues[idx].start;
          updateProgress();
          saveState();
          if (!isPlaying) togglePlay();
        }
      }
    });

    // Manual scroll override for transcript auto-scroll
    var cuesContainer = transcriptPanel.querySelector("#podcast-transcript-cues");
    cuesContainer.addEventListener("scroll", function () {
      transcriptAutoScroll = false;
      clearTimeout(transcriptScrollTimer);
      transcriptScrollTimer = setTimeout(function () {
        transcriptAutoScroll = true;
      }, 5000);
    }, { passive: true });

    // Minimize
    bar.querySelector(".podcast-btn-minimize").addEventListener("click", function () {
      isMinimized = true;
      bar.classList.add("hidden");
      pill.classList.add("visible");
      playlist.classList.remove("open");
      isPlaylistOpen = false;
      if (isTranscriptOpen) {
        isTranscriptOpen = false;
        transcriptPanel.classList.remove("open");
        bar.querySelector(".podcast-btn-transcript").classList.remove("active");
      }
      document.body.classList.remove("podcast-active");
      document.body.classList.remove("podcast-subtitle-active");
      saveState();
    });

    // Restore from pill
    pill.addEventListener("click", function () {
      isMinimized = false;
      bar.classList.remove("hidden");
      pill.classList.remove("visible");
      document.body.classList.add("podcast-active");
      if (bar.classList.contains("has-subtitle")) {
        document.body.classList.add("podcast-subtitle-active");
      }
      saveState();
    });

    // Audio events
    audio.addEventListener("ended", function () {
      if (currentIndex < PLAYLIST.length - 1) {
        playIndex(currentIndex + 1);
      } else {
        isPlaying = false;
        updatePlayButton();
        cancelAnimationFrame(rafId);
        saveState();
      }
    });

    audio.addEventListener("loadedmetadata", function () {
      var durationEl = document.getElementById("podcast-duration");
      if (durationEl && audio.duration && isFinite(audio.duration)) {
        durationEl.textContent = formatTime(audio.duration);
      }
    });

    audio.addEventListener("error", function () {
      console.error("Podcast: Failed to load", PLAYLIST[currentIndex].src);
      var titleEl = document.getElementById("podcast-title");
      if (titleEl) titleEl.textContent = "Error loading audio";
    });

    // Save state periodically while playing
    audio.addEventListener("timeupdate", function () {
      saveState();
    });
  }

  // ============================================
  // PLAYBACK
  // ============================================

  function loadTrack(index, autoplay) {
    currentIndex = index;
    var track = PLAYLIST[currentIndex];
    audio.src = track.src;

    // Reset transcript state
    transcriptCues = [];
    activeCueIndex = -1;
    clearTimeout(transcriptScrollTimer);
    transcriptAutoScroll = true;
    transcriptGeneration++;
    renderTranscriptCues();
    var subtitleEl = document.getElementById("podcast-subtitle");
    var barEl = document.getElementById("podcast-bar");
    if (subtitleEl) subtitleEl.textContent = "";
    if (barEl) barEl.classList.remove("has-subtitle");
    document.body.classList.remove("podcast-subtitle-active");
    updatePanelPositions();

    // Show/hide transcript button based on whether transcript exists
    var transcriptBtn = document.querySelector(".podcast-btn-transcript");
    if (transcriptBtn) {
      transcriptBtn.style.display = track.transcript ? "" : "none";
    }
    // If no transcript, close panel
    if (!track.transcript && isTranscriptOpen) {
      isTranscriptOpen = false;
      var tp = document.getElementById("podcast-transcript");
      if (tp) tp.classList.remove("open");
      if (transcriptBtn) transcriptBtn.classList.remove("active");
    }

    // Load transcript if available
    if (track.transcript) {
      var gen = transcriptGeneration;
      fetchTranscript(track.transcript, function (cues) {
        if (gen !== transcriptGeneration) return; // Stale fetch
        if (cues) {
          transcriptCues = cues;
          renderTranscriptCues();
          // Restore panel open state
          if (isTranscriptOpen) {
            var tp = document.getElementById("podcast-transcript");
            if (tp) tp.classList.add("open");
            if (transcriptBtn) transcriptBtn.classList.add("active");
          }
        } else if (!cues) {
          console.warn("Podcast: Failed to load transcript", track.transcript);
          if (transcriptBtn) transcriptBtn.style.display = "none";
          if (isTranscriptOpen) {
            isTranscriptOpen = false;
            var tp = document.getElementById("podcast-transcript");
            if (tp) tp.classList.remove("open");
            if (transcriptBtn) transcriptBtn.classList.remove("active");
          }
        }
      });
    }

    // Restore saved position
    var saved = loadState();
    if (saved && saved.currentIndex === index && saved.currentTime > 0) {
      audio.currentTime = saved.currentTime;
    }

    updateTrackInfo();
    updatePlaylistHighlight();

    if (autoplay) {
      audio.play().then(function () {
        isPlaying = true;
        updatePlayButton();
        startProgressLoop();
        updateMediaSession();
      }).catch(function (err) {
        console.warn("Podcast: Autoplay blocked", err);
        isPlaying = false;
        updatePlayButton();
      });
    }
  }

  function playIndex(index) {
    var wasPlaying = isPlaying;
    isPlaying = false;
    cancelAnimationFrame(rafId);
    loadTrack(index, true);
    saveState();
  }

  function togglePlay() {
    if (!audio.src) {
      loadTrack(currentIndex, true);
      return;
    }

    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      cancelAnimationFrame(rafId);
    } else {
      audio.play().then(function () {
        isPlaying = true;
        updatePlayButton();
        startProgressLoop();
        updateMediaSession();
      }).catch(function (err) {
        console.warn("Podcast: Play blocked", err);
      });
    }

    updatePlayButton();
    saveState();
  }

  // ============================================
  // UI UPDATES
  // ============================================

  function updateTrackInfo() {
    var track = PLAYLIST[currentIndex];
    var titleEl = document.getElementById("podcast-title");
    var descEl = document.getElementById("podcast-desc");
    var durationEl = document.getElementById("podcast-duration");
    var pillTitle = document.getElementById("podcast-pill-title");

    if (titleEl) titleEl.textContent = track.title;
    if (descEl) descEl.textContent = track.description; // will be overridden by active cue
    if (durationEl) durationEl.textContent = track.duration;
    if (pillTitle) pillTitle.textContent = track.title;
  }

  function updatePlayButton() {
    var barBtn = document.querySelector(".podcast-btn-play");
    var pillPlay = document.querySelector(".podcast-pill-play");

    if (barBtn) barBtn.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
    if (barBtn) barBtn.title = isPlaying ? "Pause" : "Play";
    if (pillPlay) pillPlay.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
  }

  function updateVolumeIcon() {
    var btn = document.querySelector(".podcast-btn-volume");
    if (btn) btn.innerHTML = isMuted ? ICONS.muted : ICONS.volume;
  }

  function updateProgress() {
    if (!audio.duration || !isFinite(audio.duration)) return;
    var pct = (audio.currentTime / audio.duration) * 100;
    var fill = document.getElementById("podcast-fill");
    var currentEl = document.getElementById("podcast-current");

    if (fill) fill.style.width = pct + "%";
    if (currentEl) currentEl.textContent = formatTime(audio.currentTime);
  }

  function startProgressLoop() {
    cancelAnimationFrame(rafId);
    function loop() {
      updateProgress();
      updateActiveCue();
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
  }

  function updateActiveCue() {
    if (!transcriptCues.length) return;
    var t = audio.currentTime;
    var newIndex = -1;
    for (var i = 0; i < transcriptCues.length; i++) {
      if (t >= transcriptCues[i].start && t < transcriptCues[i].end) {
        newIndex = i;
        break;
      }
    }
    if (newIndex === activeCueIndex) return;
    activeCueIndex = newIndex;

    // Update subtitle row (row 2 of bar)
    var subtitleEl = document.getElementById("podcast-subtitle");
    var bar = document.getElementById("podcast-bar");
    if (subtitleEl && bar) {
      if (newIndex >= 0) {
        subtitleEl.textContent = transcriptCues[newIndex].text;
        bar.classList.add("has-subtitle");
        document.body.classList.add("podcast-subtitle-active");
      } else {
        subtitleEl.textContent = "";
        bar.classList.remove("has-subtitle");
        document.body.classList.remove("podcast-subtitle-active");
      }
      updatePanelPositions();
    }

    // Update panel highlight
    var cuesContainer = document.getElementById("podcast-transcript-cues");
    if (!cuesContainer) return;
    var prev = cuesContainer.querySelector(".podcast-transcript-cue.active");
    if (prev) prev.classList.remove("active");
    if (newIndex >= 0) {
      var activeEl = cuesContainer.querySelector('[data-index="' + newIndex + '"]');
      if (activeEl) {
        activeEl.classList.add("active");
        if (isTranscriptOpen && transcriptAutoScroll) {
          scrollToActiveCue();
        }
      }
    }
  }

  function scrollToActiveCue() {
    var cuesContainer = document.getElementById("podcast-transcript-cues");
    if (!cuesContainer || activeCueIndex < 0) return;
    var activeEl = cuesContainer.querySelector(".podcast-transcript-cue.active");
    if (!activeEl) return;
    var containerRect = cuesContainer.getBoundingClientRect();
    var elRect = activeEl.getBoundingClientRect();
    var targetScroll = cuesContainer.scrollTop + (elRect.top - containerRect.top) - containerRect.height / 2 + elRect.height / 2;
    cuesContainer.scrollTop = targetScroll;
  }

  function updatePanelPositions() {
    var bar = document.getElementById("podcast-bar");
    if (!bar) return;
    var barHeight = bar.offsetHeight;
    var playlist = document.getElementById("podcast-playlist");
    var transcript = document.getElementById("podcast-transcript");
    if (playlist) playlist.style.bottom = barHeight + "px";
    if (transcript) transcript.style.bottom = barHeight + "px";
  }

  function renderTranscriptCues() {
    var cuesContainer = document.getElementById("podcast-transcript-cues");
    if (!cuesContainer) return;
    if (!transcriptCues.length) {
      cuesContainer.innerHTML = '<div class="podcast-transcript-empty">No transcript available</div>';
      return;
    }
    var html = "";
    for (var i = 0; i < transcriptCues.length; i++) {
      var cue = transcriptCues[i];
      html +=
        '<div class="podcast-transcript-cue" data-index="' + i + '">' +
          '<span class="podcast-transcript-time">' + formatTime(cue.start) + "</span>" +
          '<span class="podcast-transcript-text">' + escapeHtml(cue.text) + "</span>" +
        "</div>";
    }
    cuesContainer.innerHTML = html;
  }

  function updatePlaylistHighlight() {
    var playlistEl = document.getElementById("podcast-playlist");
    if (!playlistEl) return;
    playlistEl.innerHTML = buildPlaylistHTML();
  }

  // ============================================
  // MEDIA SESSION API
  // ============================================

  function updateMediaSession() {
    if (!("mediaSession" in navigator)) return;

    var track = PLAYLIST[currentIndex];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: "MJ's Blog",
      album: "Podcast",
    });

    navigator.mediaSession.setActionHandler("play", function () {
      audio.play();
      isPlaying = true;
      updatePlayButton();
      startProgressLoop();
    });
    navigator.mediaSession.setActionHandler("pause", function () {
      audio.pause();
      isPlaying = false;
      updatePlayButton();
      cancelAnimationFrame(rafId);
    });
    navigator.mediaSession.setActionHandler("previoustrack", function () {
      playIndex((currentIndex - 1 + PLAYLIST.length) % PLAYLIST.length);
    });
    navigator.mediaSession.setActionHandler("nexttrack", function () {
      playIndex((currentIndex + 1) % PLAYLIST.length);
    });
    navigator.mediaSession.setActionHandler("seekto", function (details) {
      if (details.seekTime != null) {
        audio.currentTime = details.seekTime;
        updateProgress();
        saveState();
      }
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  function formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return "0:00";
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // INIT
  // ============================================

  function init() {
    loadState();
    createPlayer();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
