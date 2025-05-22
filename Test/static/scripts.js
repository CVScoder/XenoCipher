// Global variable to store current cipher
let currentCiphertext = '';
let currentMode = '';
let attackChart = null;
let securityComparisonChart = null
let attackOverviewChart = null
let ntruChart = null
let encryptionStartTime = 0
let threeScene, threeCamera, threeRenderer, dataCube, particleSystem;
let animationRunning = false;
let currentStep = 0;

// Initialize the UI
document.addEventListener("DOMContentLoaded", () => {
  // Set up mode change handler
  document.getElementById("mode").addEventListener("change", function () {
    const mode = this.value
    // Show/hide ZTM specific elements
    const ztmElements = document.querySelectorAll(".ztm-only")
    ztmElements.forEach((el) => {
      if (mode === "ztm") {
        el.classList.remove("hidden")
      } else {
        el.classList.add("hidden")
      }
    })

    // Update step 2 label for ZTM mode
    document.getElementById("step2Label").textContent = mode === "ztm" ? "ChaCha20" : "LFSR"

    // Update security level display
    document.getElementById("securityLevel").textContent = mode === "ztm" ? "256-bit" : "192-bit"

    // Update attack overview chart if it exists
    if (attackOverviewChart) {
      updateAttackOverviewChart(mode)
    }
  })

  // Encrypt Button Handler with automatic visualization
  document.getElementById('encryptBtn').addEventListener('click', async () => {
    const input = document.getElementById('inputText').value;
    if (!input) {
      alert('Please enter some text to encrypt');
      return;
    }
    
    const mode = document.getElementById('mode').value;
    currentMode = mode;
    
    const button = document.getElementById('encryptBtn');
    const originalText = button.innerHTML;
    button.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Encrypting...';
    button.disabled = true;
    
    // Record start time
    encryptionStartTime = performance.now();
    
    try {
      // Use the server's encryption endpoint
      const response = await fetch('/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: input,
          mode: mode
        })
      });

      if (!response.ok) {
        throw new Error('Encryption failed: ' + response.statusText);
      }

      const result = await response.json();
      
      // Get the ciphertext from the server response
      const ciphertext = result.ciphertext;
      currentCiphertext = ciphertext;
      
      // Calculate encryption time
      const encryptionTime = performance.now() - encryptionStartTime;
      
      // Update UI
      document.getElementById('finalBinary').textContent = textToBinary(ciphertext);
      document.getElementById('finalHex').textContent = ciphertext;
      document.getElementById('finalBase64').textContent = btoa(ciphertext);
      document.getElementById('output').classList.remove('hidden');
      document.getElementById('processDiagram').classList.remove('hidden');
      
      // Update encryption stats
      document.getElementById('originalSize').textContent = `${input.length} bytes`;
      document.getElementById('encryptedSize').textContent = `${ciphertext.length / 2} bytes`; // Hex is 2 chars per byte
      document.getElementById('encryptionTime').textContent = `${encryptionTime.toFixed(2)} ms`;
      document.getElementById('securityLevel').textContent = mode === 'ztm' ? '256-bit' : '192-bit';
      
      // Initialize attack overview chart
      if (!attackOverviewChart) {
        initAttackOverviewChart();
      } else {
        updateAttackOverviewChart(mode);
      }
      
      // Animate encryption process
      animateEncryptionProcess(mode);
      
      // Show and animate advanced visualization
      document.getElementById('advancedVisualization').classList.remove('hidden');
      anime({
        targets: '#advancedVisualization',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        easing: 'easeOutQuad'
      });
      
      // Simulate encryption details - we'll still use this for visualization
      simulateEncryptionDetails(input, mode);
      
      // Automatically start the advanced visualization
      startEncryptionVisualization();
      
      // Animate ciphertext appearance
      anime({
        targets: '#cipherText',
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutQuad'
      });
      
      // Re-enable button
      button.innerHTML = originalText;
      button.disabled = false;
    } catch (error) {
      console.error('Encryption error:', error);
      alert('Error during encryption: ' + error.message);
      button.innerHTML = originalText;
      button.disabled = false;
    }
  });

  // Initialize attack overview chart
  function initAttackOverviewChart() {
    const ctx = document.getElementById("attackOverviewChart").getContext("2d")

    // Create gradient for the chart
    const gradient1 = ctx.createLinearGradient(0, 0, 0, 400)
    gradient1.addColorStop(0, "rgba(59, 130, 246, 0.6)")
    gradient1.addColorStop(1, "rgba(59, 130, 246, 0.1)")

    attackOverviewChart = new Chart(ctx, {
      type: "radar",
      data: {
        labels: ["Brute Force", "Quantum", "Side-Channel", "Chosen Plaintext", "MITM"],
        datasets: [
          {
            label: "ZTM Mode",
            data: [9.8, 9.2, 7.5, 9.0, 8.5],
            backgroundColor: gradient1,
            borderColor: "rgb(59, 130, 246)",
            borderWidth: 2,
            pointBackgroundColor: "rgb(59, 130, 246)",
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            max: 10,
            ticks: {
              stepSize: 2,
              backdropColor: "rgba(255, 255, 255, 0.8)",
            },
            pointLabels: {
              font: {
                size: 12,
                weight: "bold",
              },
            },
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
            },
            angleLines: {
              color: "rgba(0, 0, 0, 0.1)",
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: "Attack Resistance (Higher is Better)",
            font: {
              size: 16,
              weight: "bold",
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
          legend: {
            display: true,
            position: "bottom",
            labels: {
              boxWidth: 15,
              padding: 15,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.raw}/10`,
            },
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleFont: {
              size: 14,
            },
            bodyFont: {
              size: 13,
            },
            padding: 10,
            cornerRadius: 6,
          },
        },
      },
    })
  }

  // Update attack overview chart based on mode
  function updateAttackOverviewChart(mode) {
    if (!attackOverviewChart) return

    if (mode === "ztm") {
      attackOverviewChart.data.datasets[0].label = "ZTM Mode"
      attackOverviewChart.data.datasets[0].data = [9.8, 9.2, 7.5, 9.0, 8.5]
    } else {
      attackOverviewChart.data.datasets[0].label = "Normal Mode"
      attackOverviewChart.data.datasets[0].data = [8.5, 7.0, 6.2, 8.7, 7.8]
    }

    attackOverviewChart.update()
  }

  // NTRU Demo button handler
  document.getElementById("ntruDemoBtn").addEventListener("click", async () => {
    // Show loading state
    const button = document.getElementById("ntruDemoBtn")
    const originalText = button.textContent
    button.innerHTML =
      '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Running NTRU Exchange...'
    button.disabled = true

    try {
      const response = await fetch("/ntru_demo")
      if (!response.ok) {
        throw new Error("NTRU demo failed")
      }

      const result = await response.json()

      // Display results
      document.getElementById("originalKey").textContent = result.original_key
      document.getElementById("decryptedKey").textContent = result.decrypted_key

      const matchStatus = document.getElementById("ntruMatchStatus")
      if (result.match) {
        matchStatus.textContent = "✓ Keys Match - Exchange Successful"
        matchStatus.className = "inline-block px-3 py-1 rounded-md font-medium text-sm bg-green-100 text-green-800"
      } else {
        matchStatus.textContent = "✗ Keys Don't Match - Exchange Failed"
        matchStatus.className = "inline-block px-3 py-1 rounded-md font-medium text-sm bg-red-100 text-red-800"
      }

      // Show the result section
      document.getElementById("ntruResult").classList.remove("hidden")

      // Create NTRU polynomial visualization
      createNtruVisualization(result.parameters)

      // Animation for results appearance
      anime({
        targets: "#ntruResult",
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 500,
        easing: "easeOutQuad",
      })
    } catch (error) {
      console.error("NTRU demo error:", error)
      alert("Error during NTRU demonstration: " + error.message)
    } finally {
      button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Run NTRU Key Exchange Demo
            `
      button.disabled = false
    }
  })

  // Create NTRU polynomial visualization
  function createNtruVisualization(parameters) {
    const vizEl = document.getElementById("ntruPolyViz")
    const chartEl = document.getElementById("ntruChart")

    // Get NTRU parameters if available
    const N = parameters?.N || 743
    const q = parameters?.q || 2048

    // Sample NTRU polynomial coefficients for visualization
    // In a real implementation, these would come from the actual NTRU operation
    const sampleSize = 50 // Show first 50 coefficients for clarity
    const publicKeyCoeffs = Array(sampleSize)
      .fill(0)
      .map(() => Math.floor(Math.random() * q))

    // Reset previous chart if it exists
    if (ntruChart) {
      ntruChart.destroy()
    }

    // Create gradient for bars
    const ctx = chartEl.getContext("2d")
    const gradient = ctx.createLinearGradient(0, 0, 0, 400)
    gradient.addColorStop(0, "rgba(79, 70, 229, 0.8)")
    gradient.addColorStop(1, "rgba(79, 70, 229, 0.2)")

    ntruChart = new Chart(chartEl, {
      type: "bar",
      data: {
        labels: Array.from({ length: sampleSize }, (_, i) => i + 1),
        datasets: [
          {
            label: "Public Key Coefficients (first 50)",
            data: publicKeyCoeffs,
            backgroundColor: gradient,
            borderColor: "rgb(79, 70, 229)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Coefficient Value (mod q)",
            },
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Coefficient Index",
            },
            grid: {
              display: false,
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: "NTRU Public Key Polynomial Coefficients",
            font: {
              size: 14,
            },
          },
          legend: {
            display: true,
            position: "bottom",
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => `Coefficient ${tooltipItems[0].label}`,
              label: (context) => `Value: ${context.raw} (mod ${q})`,
            },
          },
        },
      },
    })

    // Show the visualization
    vizEl.classList.remove("hidden")
  }

  // Attack button handlers
  document.querySelectorAll(".attackBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      if (!currentCiphertext) {
        alert("Please encrypt a message first")
        return
      }

      const attackType = e.currentTarget.dataset.attack
      const button = e.currentTarget

      // Store original content
      const originalContent = button.innerHTML

      // Disable all attack buttons
      document.querySelectorAll(".attackBtn").forEach((b) => (b.disabled = true))

      // Show loading state
      button.innerHTML =
        '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Running...'

      try {
        // Send attack request to server
        const response = await fetch("/attack", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            attack_type: attackType,
            ciphertext: currentCiphertext,
            mode: currentMode,
          }),
        })

        if (!response.ok) {
          throw new Error("Attack simulation failed")
        }

        const result = await response.json()
        displayEnhancedAttackResult(attackType, result)
      } catch (error) {
        console.error("Attack error:", error)
        alert("Error during attack simulation: " + error.message)
      } finally {
        // Re-enable all attack buttons
        document.querySelectorAll(".attackBtn").forEach((b) => {
          b.disabled = false
          // Reset the clicked button's content
          if (b === button) {
            b.innerHTML = originalContent
          }
        })
      }
    })
  })

  // Helper to get full attack name
  function getAttackName(attackType) {
    const names = {
      brute: "Brute Force Attack",
      chosen: "Chosen Plaintext Attack",
      mitm: "Man-in-the-Middle Attack",
      side: "Side-Channel Attack",
      quantum: "Quantum Attack",
      dos: "Denial-of-Service Attack",
    }
    return names[attackType] || attackType
  }

  // Display enhanced attack results
  function displayEnhancedAttackResult(attackType, result) {
    const resultEl = document.getElementById("attackResult")
    const nameEl = document.getElementById("attackName")
    const statusEl = document.getElementById("attackStatus")
    const messageEl = document.getElementById("attackMessage")
    const statsEl = document.getElementById("attackStats")
    const cardEl = document.getElementById("attackResultCard")
    const timelineEl = document.getElementById("attackTimeline")

    // Set basic info
    nameEl.textContent = getAttackName(attackType)
    statusEl.textContent = result.success ? "Succeeded" : "Failed"

    // Set status color and card style
    if (result.success) {
      statusEl.className = "bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium"
      cardEl.className = cardEl.className.replace(/attack-card\s+(success|failure)?/g, "attack-card success")
    } else {
      statusEl.className = "bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
      cardEl.className = cardEl.className.replace(/attack-card\s+(success|failure)?/g, "attack-card failure")
    }

    messageEl.textContent = result.message

    // Clear previous stats
    statsEl.innerHTML = ""
    timelineEl.innerHTML = ""

    // Create attack timeline based on attack type
    createAttackTimeline(attackType, result, timelineEl)

    // Add stats excluding message and success flag
    Object.entries(result).forEach(([key, value]) => {
      if (key !== "message" && key !== "success" && key !== "error") {
        const statDiv = document.createElement("div")
        statDiv.className = "p-2 bg-gray-50 rounded"

        // Format key for display
        const formattedKey = key
          .replace(/_/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")

        // Add badge for certain metrics
        let badgeClass = ""
        let displayValue = value

        if (key.includes("resistance") || key.includes("security_margin") || key.includes("entropy_quality")) {
          // Parse numeric value if possible
          const numValue = Number.parseFloat(value.toString().replace(/[^\d.]/g, ""))
          if (!isNaN(numValue)) {
            if (numValue > 80) {
              badgeClass = "good"
            } else if (numValue > 50) {
              badgeClass = "medium"
            } else {
              badgeClass = "bad"
            }

            displayValue = `<span class="metric-badge ${badgeClass}">${value}</span>`
          }
        }

        statDiv.innerHTML = `<span class="font-medium">${formattedKey}:</span> ${displayValue}`
        statsEl.appendChild(statDiv)
      }
    })

    // Show the result section
    resultEl.classList.remove("hidden")

    // Animate appearance
    anime({
      targets: "#attackResultCard",
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 500,
      easing: "easeOutQuad",
    })

    // Create enhanced visualization based on attack type
    createEnhancedAttackVisualization(attackType, result)
  }

  // Create attack timeline
  function createAttackTimeline(attackType, result, timelineEl) {
    // Create timeline items based on attack type
    const timelineItems = []

    switch (attackType) {
      case "brute":
        timelineItems.push({
          title: "Attack Initiated",
          description: "Brute force attack started against the cipher",
          status: "neutral",
        })
        timelineItems.push({
          title: "Key Space Analysis",
          description: `Effective key space: ${result.key_space || "2^256"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Entropy Analysis",
          description: `Ciphertext entropy: ${result.entropy_score || "7.98/8.00"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Attack Progress",
          description: `${result.attempts || "10,000"} keys tried`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Attack Conclusion",
          description: result.success
            ? "Attack succeeded (simulated for demo)"
            : `Attack failed. Estimated time: ${result.estimated_years || "10^63"} years`,
          status: result.success ? "success" : "failure",
        })
        break

      case "quantum":
        timelineItems.push({
          title: "Quantum Resources Assessment",
          description: `Available qubits: ${result.physical_qubits_available || "127"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Algorithm Selection",
          description: `Grover's algorithm applicable: ${result.grover_algorithm_applicable || "Yes"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Quantum Circuit Design",
          description: `Required circuit depth: ${result.circuit_depth_required || "10,000+"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Quantum Simulation",
          description: `Success probability: ${result.success_probability || "0.000001"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Attack Conclusion",
          description: result.success
            ? "Attack succeeded (simulated for demo)"
            : `Attack failed. Required qubits: ${result.logical_qubits_needed || "2,972"}`,
          status: result.success ? "success" : "failure",
        })
        break

      case "side":
        timelineItems.push({
          title: "Timing Analysis",
          description: `Coefficient of variation: ${result.coefficient_variation || "0.0012"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Power Analysis",
          description: `Power variation: ${result.power_variation || "0.0018"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Cache Attack",
          description: `Cache variation: ${result.cache_variation || "0.0022"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Pattern Analysis",
          description: `Pattern difference: ${result.max_pattern_difference || "1.23%"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Attack Conclusion",
          description: result.success
            ? "Side-channel leakage detected"
            : "No significant side-channel leakage detected",
          status: result.success ? "success" : "failure",
        })
        break

      case "chosen":
        timelineItems.push({
          title: "Sample Generation",
          description: `Generated ${result.samples_analyzed || "100"} chosen plaintexts`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Avalanche Analysis",
          description: `Avalanche effect: ${result.avalanche_score || "0.498"} (ideal: 0.5)`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Diffusion Analysis",
          description: `Diffusion score: ${result.diffusion_score || "0.482"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Pattern Detection",
          description: `Pattern detection: ${result.pattern_detection || "0.02%"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Attack Conclusion",
          description: result.success ? "Patterns detected in ciphertext" : "No significant patterns detected",
          status: result.success ? "success" : "failure",
        })
        break

      case "mitm":
        timelineItems.push({
          title: "Key Exchange Interception",
          description: "Attempting to intercept NTRU key exchange",
          status: "neutral",
        })
        timelineItems.push({
          title: "Lattice Analysis",
          description: `Lattice dimension: ${result.lattice_dimension || "743"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "BKZ Reduction",
          description: `BKZ block size: ${result.bkz_block_size || "30"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Key Recovery Attempt",
          description: `Key recovery progress: ${result.key_recovery_progress || "0.00%"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Attack Conclusion",
          description: result.success
            ? "MITM attack succeeded (simulated for demo)"
            : `MITM attack failed. Security: ${result.security_bits || "256"}-bit`,
          status: result.success ? "success" : "failure",
        })
        break

      case "dos":
        timelineItems.push({
          title: "Load Generation",
          description: `Generated ${result.requests || "200"} concurrent requests`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Server Response",
          description: `Completed: ${result.completed || "180"}, Failed: ${result.failed || "20"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Resource Monitoring",
          description: `CPU usage: ${result.cpu_usage_avg || "85.2%"}, Memory: ${result.memory_usage_total || "24.5MB"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Performance Impact",
          description: `System load: ${result.system_load || "92.3%"}`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Attack Conclusion",
          description: result.success
            ? `Service degraded by ${result.service_degradation || "35.2%"}`
            : `System remained stable at ${result.requests_per_second || "18.5"} req/sec`,
          status: result.success ? "success" : "failure",
        })
        break

      default:
        timelineItems.push({
          title: "Attack Initiated",
          description: `${getAttackName(attackType)} started`,
          status: "neutral",
        })
        timelineItems.push({
          title: "Attack Conclusion",
          description: result.success ? "Attack succeeded" : "Attack failed",
          status: result.success ? "success" : "failure",
        })
    }

    // Render timeline items
    timelineItems.forEach((item) => {
      const itemEl = document.createElement("div")
      itemEl.className = `attack-timeline-item ${item.status}`
      itemEl.innerHTML = `
            <h5 class="font-medium">${item.title}</h5>
            <p class="text-gray-600">${item.description}</p>
        `
      timelineEl.appendChild(itemEl)
    })
  }

  // Create enhanced attack visualizations
  function createEnhancedAttackVisualization(attackType, result) {
    const vizEl = document.getElementById("performanceViz")
    const chartEl = document.getElementById("attackChart")
    const securityChartEl = document.getElementById("securityComparisonChart")

    // Reset previous charts if they exist
    if (attackChart) {
      attackChart.destroy()
    }

    if (securityComparisonChart) {
      securityComparisonChart.destroy()
    }

    // Different visualizations for different attacks
    let chartData = {
      labels: [],
      datasets: [],
    }

    let chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
        datalabels: {
          color: "#fff",
          font: {
            weight: "bold",
          },
          formatter: (value) => {
            if (value > 1000) {
              return value.toExponential(1)
            }
            return value
          },
        },
      },
    }

    let chartType = "bar"

    // Security comparison chart data
    const securityChartData = {
      labels: ["XenoCipher", "AES", "RSA", "ECC"],
      datasets: [],
    }

    let securityChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
        title: {
          display: true,
          text: "Security Comparison",
          font: {
            size: 16,
            weight: "bold",
          },
        },
      },
    }

    switch (attackType) {
      case "brute":
        vizEl.classList.remove("hidden")

        // Create gradient for bars
        const ctx = chartEl.getContext("2d")
        const blueGradient = ctx.createLinearGradient(0, 0, 0, 400)
        blueGradient.addColorStop(0, "rgba(59, 130, 246, 0.8)")
        blueGradient.addColorStop(1, "rgba(59, 130, 246, 0.2)")

        const redGradient = ctx.createLinearGradient(0, 0, 0, 400)
        redGradient.addColorStop(0, "rgba(239, 68, 68, 0.8)")
        redGradient.addColorStop(1, "rgba(239, 68, 68, 0.2)")

        const yellowGradient = ctx.createLinearGradient(0, 0, 0, 400)
        yellowGradient.addColorStop(0, "rgba(245, 158, 11, 0.8)")
        yellowGradient.addColorStop(1, "rgba(245, 158, 11, 0.2)")

        const greenGradient = ctx.createLinearGradient(0, 0, 0, 400)
        greenGradient.addColorStop(0, "rgba(16, 185, 129, 0.8)")
        greenGradient.addColorStop(1, "rgba(16, 185, 129, 0.2)")

        // Parse theoretical years from result
        let theoreticalYears = {}
        if (typeof result.theoretical_years === "object") {
          theoreticalYears = result.theoretical_years
        } else {
          theoreticalYears = {
            consumer_pc: "1e58",
            gpu_cluster: "1e55",
            custom_asic: "1e53",
            quantum_computer: "1e29",
          }
        }

        // Convert to numbers
        const yearsData = Object.entries(theoreticalYears).map(([k, v]) => {
          return {
            hardware: k
              .replace(/_/g, " ")
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" "),
            years: Number.parseFloat(v.replace(/[^0-9.e+-]/g, "")),
          }
        })

        // Sort by years (ascending)
        yearsData.sort((a, b) => a.years - b.years)

        chartData = {
          labels: yearsData.map((d) => d.hardware),
          datasets: [
            {
              label: "Years to Break (log scale)",
              data: yearsData.map((d) => d.years),
              backgroundColor: [greenGradient, yellowGradient, redGradient, blueGradient],
              borderColor: ["rgb(16, 185, 129)", "rgb(245, 158, 11)", "rgb(239, 68, 68)", "rgb(59, 130, 246)"],
              borderWidth: 1,
            },
          ],
        }

        chartOptions = {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: "logarithmic",
              title: {
                display: true,
                text: "Years (logarithmic scale)",
              },
              grid: {
                color: "rgba(0, 0, 0, 0.05)",
              },
            },
            y: {
              grid: {
                display: false,
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: "Time to Break by Hardware Type",
              font: {
                size: 16,
                weight: "bold",
              },
            },
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw
                  if (value >= 1e20) {
                    return `${value.toExponential(2)} years`
                  } else {
                    return `${value.toLocaleString()} years`
                  }
                },
              },
            },
          },
        }

        // Security comparison chart
        const secCtx = securityChartEl.getContext("2d")

        securityChartData.datasets = [
          {
            label: "Key Size (bits)",
            data: [result.effective_security_bits || 256, 256, 2048, 256],
            backgroundColor: [blueGradient, greenGradient, redGradient, yellowGradient],
            borderColor: ["rgb(59, 130, 246)", "rgb(16, 185, 129)", "rgb(239, 68, 68)", "rgb(245, 158, 11)"],
            borderWidth: 1,
          },
          {
            label: "Effective Security (bits)",
            data: [result.effective_security_bits || 256, 256, 112, 128],
            backgroundColor: [
              "rgba(59, 130, 246, 0.5)",
              "rgba(16, 185, 129, 0.5)",
              "rgba(239, 68, 68, 0.5)",
              "rgba(245, 158, 11, 0.5)",
            ],
            borderColor: ["rgb(59, 130, 246)", "rgb(16, 185, 129)", "rgb(239, 68, 68)", "rgb(245, 158, 11)"],
            borderWidth: 1,
          },
        ]

        securityChartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Bits",
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: "Key Size vs. Effective Security",
              font: {
                size: 16,
                weight: "bold",
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${context.raw} bits`,
              },
            },
          },
        }
        break

      case "quantum":
        vizEl.classList.remove("hidden")

        // Create gradients
        const qCtx = chartEl.getContext("2d")
        const availableGradient = qCtx.createLinearGradient(0, 0, 0, 400)
        availableGradient.addColorStop(0, "rgba(239, 68, 68, 0.8)")
        availableGradient.addColorStop(1, "rgba(239, 68, 68, 0.2)")

        const neededGradient = qCtx.createLinearGradient(0, 0, 0, 400)
        neededGradient.addColorStop(0, "rgba(59, 130, 246, 0.8)")
        neededGradient.addColorStop(1, "rgba(59, 130, 246, 0.2)")

        const circuitGradient = qCtx.createLinearGradient(0, 0, 0, 400)
        circuitGradient.addColorStop(0, "rgba(16, 185, 129, 0.8)")
        circuitGradient.addColorStop(1, "rgba(16, 185, 129, 0.2)")

        chartData = {
          labels: ["Physical Qubits", "Logical Qubits", "Circuit Depth"],
          datasets: [
            {
              label: "Available",
              data: [
                Number.parseInt(result.physical_qubits_available || 127),
                Number.parseFloat(result.logical_qubits_available || 0.127),
                Number.parseInt(result.circuit_depth_available || 1000),
              ],
              backgroundColor: [availableGradient, availableGradient, availableGradient],
              borderColor: ["rgb(239, 68, 68)", "rgb(239, 68, 68)", "rgb(239, 68, 68)"],
              borderWidth: 1,
            },
            {
              label: "Required",
              data: [
                Number.parseInt(result.logical_qubits_needed || 2972) * 1000, // Physical qubits needed
                Number.parseInt(result.logical_qubits_needed || 2972),
                Number.parseInt(result.circuit_depth_required || 100000),
              ],
              backgroundColor: [neededGradient, neededGradient, neededGradient],
              borderColor: ["rgb(59, 130, 246)", "rgb(59, 130, 246)", "rgb(59, 130, 246)"],
              borderWidth: 1,
            },
          ],
        }

        chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: "logarithmic",
              beginAtZero: true,
              title: {
                display: true,
                text: "Quantum Resources Comparison",
              },
            },
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
          },
          plugins: {
            title: {
              display: true,
              text: "Quantum Attack Resources",
              font: {
                size: 16,
                weight: "bold",
              },
            },
            legend: {
              position: "bottom",
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${context.raw.toLocaleString()}`,
              },
            },
          },
        }
        // Security comparison chart for quantum resistance
        const qSecCtx = securityChartEl.getContext("2d")
        const qBlueGradient = qSecCtx.createLinearGradient(0, 0, 0, 400)
        qBlueGradient.addColorStop(0, "rgba(59, 130, 246, 0.8)")
        qBlueGradient.addColorStop(1, "rgba(59, 130, 246, 0.2)")

        const qGreenGradient = qSecCtx.createLinearGradient(0, 0, 0, 400)
        qGreenGradient.addColorStop(0, "rgba(16, 185, 129, 0.8)")
        qGreenGradient.addColorStop(1, "rgba(16, 185, 129, 0.2)")

        const qRedGradient = qSecCtx.createLinearGradient(0, 0, 0, 400)
        qRedGradient.addColorStop(0, "rgba(239, 68, 68, 0.8)")
        qRedGradient.addColorStop(1, "rgba(239, 68, 68, 0.2)")

        const qYellowGradient = qSecCtx.createLinearGradient(0, 0, 0, 400)
        qYellowGradient.addColorStop(0, "rgba(245, 158, 11, 0.8)")
        qYellowGradient.addColorStop(1, "rgba(245, 158, 11, 0.2)")

        securityChartData.datasets = [
          {
            label: "Classical Security (bits)",
            data: [Number.parseInt(result.classical_security_bits || 256), 256, 112, 128],
            backgroundColor: [qBlueGradient, qGreenGradient, qRedGradient, qYellowGradient],
            borderColor: ["rgb(59, 130, 246)", "rgb(16, 185, 129)", "rgb(239, 68, 68)", "rgb(245, 158, 11)"],
            borderWidth: 1,
          },
          {
            label: "Quantum Security (bits)",
            data: [Number.parseInt(result.quantum_security_bits || 128), 128, 0, 0],
            backgroundColor: [
              "rgba(59, 130, 246, 0.5)",
              "rgba(16, 185, 129, 0.5)",
              "rgba(239, 68, 68, 0.5)",
              "rgba(245, 158, 11, 0.5)",
            ],
            borderColor: ["rgb(59, 130, 246)", "rgb(16, 185, 129)", "rgb(239, 68, 68)", "rgb(245, 158, 11)"],
            borderWidth: 1,
            borderDash: [5, 5],
          },
        ]

        securityChartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Security Level (bits)",
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: "Quantum vs. Classical Security",
              font: {
                size: 16,
                weight: "bold",
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${context.raw} bits`,
              },
            },
          },
        }
        break

      case "side":
        vizEl.classList.remove("hidden")

        // Create gradient for area
        const sCtx = chartEl.getContext("2d")
        const areaGradient = sCtx.createLinearGradient(0, 0, 0, 400)
        areaGradient.addColorStop(0, "rgba(59, 130, 246, 0.6)")
        areaGradient.addColorStop(1, "rgba(59, 130, 246, 0.1)")

        // Parse resistance score to number
        const resistanceScore = Number.parseFloat(result.resistance_score?.split("/")[0] || "8.7")

        chartType = "radar"
        chartData = {
          labels: [
            "Timing Consistency",
            "Power Analysis Resistance",
            "Cache Attack Resistance",
            "Fault Injection Resistance",
            "Statistical Analysis Resistance",
          ],
          datasets: [
            {
              label: "XenoCipher Side-Channel Resistance",
              data: [
                10 - Number.parseFloat(result.coefficient_variation || "0.0012") * 1000, // Higher is better
                10 - Number.parseFloat(result.power_variation || "0.0018") * 1000,
                10 - Number.parseFloat(result.cache_variation || "0.0022") * 1000,
                resistanceScore - 0.7,
                10 - Number.parseFloat(result.max_pattern_difference?.replace("%", "") || "1.23") / 2,
              ],
              backgroundColor: areaGradient,
              borderColor: "rgb(59, 130, 246)",
              pointBackgroundColor: "rgb(59, 130, 246)",
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2,
            },
          ],
        }

        chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              min: 0,
              max: 10,
              ticks: {
                stepSize: 2,
              },
              pointLabels: {
                font: {
                  size: 11,
                  weight: "bold",
                },
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: "Side-Channel Attack Resistance (Higher is Better)",
              font: {
                size: 16,
                weight: "bold",
              },
            },
            legend: {
              display: true,
              position: "bottom",
            },
            tooltip: {
              callbacks: {
                label: (context) => `Score: ${context.raw.toFixed(1)}/10`,
              },
            },
          },
        }

        // Security comparison chart for side-channel resistance
        const sSecCtx = securityChartEl.getContext("2d")

        securityChartData.datasets = [
          {
            label: "Side-Channel Resistance (0-10)",
            data: [resistanceScore, 6.5, 4.2, 5.8],
            backgroundColor: [
              "rgba(59, 130, 246, 0.7)",
              "rgba(16, 185, 129, 0.7)",
              "rgba(239, 68, 68, 0.7)",
              "rgba(245, 158, 11, 0.7)",
            ],
            borderColor: ["rgb(59, 130, 246)", "rgb(16, 185, 129)", "rgb(239, 68, 68)", "rgb(245, 158, 11)"],
            borderWidth: 1,
          },
        ]

        securityChartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 10,
              title: {
                display: true,
                text: "Resistance Score (0-10)",
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: "Side-Channel Resistance Comparison",
              font: {
                size: 16,
                weight: "bold",
              },
            },
          },
        }
        break

      case "mitm":
        vizEl.classList.remove("hidden")

        // Create gradients
        const mCtx = chartEl.getContext("2d")
        const ntruGradient = mCtx.createLinearGradient(0, 0, 0, 400)
        ntruGradient.addColorStop(0, "rgba(59, 130, 246, 0.8)")
        ntruGradient.addColorStop(1, "rgba(59, 130, 246, 0.2)")

        const rsaGradient = mCtx.createLinearGradient(0, 0, 0, 400)
        rsaGradient.addColorStop(0, "rgba(239, 68, 68, 0.8)")
        rsaGradient.addColorStop(1, "rgba(239, 68, 68, 0.2)")

        const eccGradient = mCtx.createLinearGradient(0, 0, 0, 400)
        eccGradient.addColorStop(0, "rgba(75, 192, 192, 0.8)")
        eccGradient.addColorStop(1, "rgba(75, 192, 192, 0.2)")

        const dhGradient = mCtx.createLinearGradient(0, 0, 0, 400)
        dhGradient.addColorStop(0, "rgba(255, 159, 64, 0.8)")
        dhGradient.addColorStop(1, "rgba(255, 159, 64, 0.2)")

        // Show NTRU vs traditional key exchange security
        chartData = {
          labels: ["NTRU (Post-Quantum)", "RSA-2048", "ECC-256", "DH-2048"],
          datasets: [
            {
              label: "Classical Security Level (bits)",
              data: [result.security_bits || 256, 112, 128, 112],
              backgroundColor: [ntruGradient, rsaGradient, eccGradient, dhGradient],
              borderColor: ["rgb(59, 130, 246)", "rgb(239, 68, 68)", "rgb(75, 192, 192)", "rgb(255, 159, 64)"],
              borderWidth: 1,
            },
            {
              label: "Quantum Security Level (bits)",
              data: [result.security_bits / 2 || 128, 0, 0, 0],
              backgroundColor: [
                "rgba(59, 130, 246, 0.3)",
                "rgba(239, 68, 68, 0.3)",
                "rgba(75, 192, 192, 0.3)",
                "rgba(255, 159, 64, 0.3)",
              ],
              borderColor: ["rgb(59, 130, 246)", "rgb(239, 68, 68)", "rgb(75, 192, 192)", "rgb(255, 159, 64)"],
              borderWidth: 1,
              borderDash: [5, 5],
            },
          ],
        }

        chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Security Level (bits)",
              },
              grid: {
                color: "rgba(0, 0, 0, 0.05)",
              },
            },
            x: {
              grid: {
                display: false,
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: "Key Exchange Security Comparison",
              font: {
                size: 16,
                weight: "bold",
              },
            },
            legend: {
              display: true,
              position: "bottom",
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${context.raw} bits`,
              },
            },
          },
        }

        // Security comparison chart - MITM attack complexity
        const mSecCtx = securityChartEl.getContext("2d")

        // Parse BKZ time from result
        const bkzYears = Number.parseFloat(result.bkz_time_years?.replace(/[^0-9.e+-]/g, "") || "1e30")

        securityChartData.datasets = [
          {
            label: "Attack Complexity (log years)",
            data: [
              Math.log10(bkzYears),
              Math.log10(1e20), // RSA
              Math.log10(1e15), // ECC
              Math.log10(1e12), // DH
            ],
            backgroundColor: [
              "rgba(59, 130, 246, 0.7)",
              "rgba(239, 68, 68, 0.7)",
              "rgba(75, 192, 192, 0.7)",
              "rgba(255, 159, 64, 0.7)",
            ],
            borderColor: ["rgb(59, 130, 246)", "rgb(239, 68, 68)", "rgb(75, 192, 192)", "rgb(255, 159, 64)"],
            borderWidth: 1,
          },
        ]

        securityChartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              title: {
                display: true,
                text: "Attack Complexity (log₁₀ years)",
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: "MITM Attack Complexity",
              font: {
                size: 16,
                weight: "bold",
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: 10^${context.raw.toFixed(1)} years`,
              },
            },
          },
        }
        break

      case "chosen":
        vizEl.classList.remove("hidden")

        // Create gradient
        const cCtx = chartEl.getContext("2d")
        const lineGradient = cCtx.createLinearGradient(0, 0, 0, 400)
        lineGradient.addColorStop(0, "rgba(59, 130, 246, 0.8)")
        lineGradient.addColorStop(1, "rgba(59, 130, 246, 0.2)")

        const line2Gradient = cCtx.createLinearGradient(0, 0, 0, 400)
        line2Gradient.addColorStop(0, "rgba(16, 185, 129, 0.8)")
        line2Gradient.addColorStop(1, "rgba(16, 185, 129, 0.2)")

        // Parse values from result
        const diffusionScore = Number.parseFloat(result.diffusion_score || "0.48")
        const avalancheScore = Number.parseFloat(result.avalanche_score || "0.49")
        const patternDetection = Number.parseFloat(result.pattern_detection?.replace("%", "") || "0.02") / 100

        chartType = "line"
        chartData = {
          labels: ["Initial", "After LFSR", "After Chaotic", "After Transposition", "Final"],
          datasets: [
            {
              label: "Diffusion Rate",
              data: [0, 0.25, 0.38, 0.45, diffusionScore],
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              borderColor: "rgb(59, 130, 246)",
              tension: 0.4,
              fill: true,
            },
            {
              label: "Avalanche Effect",
              data: [0, 0.3, 0.42, 0.47, avalancheScore],
              backgroundColor: "rgba(16, 185, 129, 0.2)",
              borderColor: "rgb(16, 185, 129)",
              tension: 0.4,
              fill: true,
            },
          ],
        }

        chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 0.6,
              title: {
                display: true,
                text: "Rate (higher is better)",
              },
              grid: {
                color: "rgba(0, 0, 0, 0.05)",
              },
            },
            x: {
              grid: {
                display: false,
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: "Chosen Plaintext Attack Resistance",
              font: {
                size: 16,
                weight: "bold",
              },
            },
            legend: {
              display: true,
              position: "bottom",
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${context.raw.toFixed(4)}`,
              },
            },
          },
        }

        // Security comparison chart - Avalanche effect
        const cSecCtx = securityChartEl.getContext("2d")

        securityChartData.datasets = [
          {
            label: "Avalanche Effect (ideal: 0.5)",
            data: [avalancheScore, 0.501, 0.499, 0.502],
            backgroundColor: [
              "rgba(59, 130, 246, 0.7)",
              "rgba(16, 185, 129, 0.7)",
              "rgba(239, 68, 68, 0.7)",
              "rgba(245, 158, 11, 0.7)",
            ],
            borderColor: ["rgb(59, 130, 246)", "rgb(16, 185, 129)", "rgb(239, 68, 68)", "rgb(245, 158, 11)"],
            borderWidth: 1,
          },
          {
            label: "Pattern Detection (%)",
            data: [patternDetection * 100, 0.02, 0.03, 0.02],
            backgroundColor: [
              "rgba(59, 130, 246, 0.3)",
              "rgba(16, 185, 129, 0.3)",
              "rgba(239, 68, 68, 0.3)",
              "rgba(245, 158, 11, 0.3)",
            ],
            borderColor: ["rgb(59, 130, 246)", "rgb(16, 185, 129)", "rgb(239, 68, 68)", "rgb(245, 158, 11)"],
            borderWidth: 1,
            borderDash: [5, 5],
          },
        ]

        securityChartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Value",
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: "Avalanche Effect & Pattern Detection",
              font: {
                size: 16,
                weight: "bold",
              },
            },
          },
        }
        break

      case "dos":
        vizEl.classList.remove("hidden")

        // Parse values
        const requestsPerSecond = Number.parseFloat(result.requests_per_second || "10")
        const failureRate = Number.parseFloat(result.failure_rate || "0.05")
        const cpuOverhead = Number.parseFloat(result.cpu_usage_avg?.replace("%", "") || "7.2")
        const systemLoad = Number.parseFloat(result.system_load?.replace("%", "") || "92.3")

        chartType = "bar"
        chartData = {
          labels: ["Normal Load", "DoS Attack"],
          datasets: [
            {
              label: "Requests/sec",
              data: [requestsPerSecond * 1.5, requestsPerSecond],
              backgroundColor: "rgba(59, 130, 246, 0.6)",
              borderColor: "rgb(59, 130, 246)",
              borderWidth: 1,
              yAxisID: "y",
            },
            {
              label: "Failure Rate (%)",
              data: [0, failureRate * 100],
              backgroundColor: "rgba(239, 68, 68, 0.6)",
              borderColor: "rgb(239, 68, 68)",
              borderWidth: 1,
              yAxisID: "y1",
            },
            {
              label: "System Load (%)",
              data: [systemLoad * 0.6, systemLoad],
              backgroundColor: "rgba(245, 158, 11, 0.6)",
              borderColor: "rgb(245, 158, 11)",
              borderWidth: 1,
              yAxisID: "y1",
            },
          ],
        }

        chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              position: "left",
              title: {
                display: true,
                text: "Requests/sec",
              },
              grid: {
                color: "rgba(0, 0, 0, 0.05)",
              },
            },
            y1: {
              beginAtZero: true,
              position: "right",
              title: {
                display: true,
                text: "Percentage (%)",
              },
              grid: {
                drawOnChartArea: false,
              },
              max: 100,
            },
            x: {
              grid: {
                display: false,
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: "DoS Attack Performance Impact",
              font: {
                size: 16,
                weight: "bold",
              },
            },
            legend: {
              display: true,
              position: "bottom",
            },
          },
        }

        // Security comparison chart - DoS resistance
        const dSecCtx = securityChartEl.getContext("2d")

        // Parse service degradation
        const serviceDegradation = Number.parseFloat(result.service_degradation?.replace("%", "") || "35.2")

        securityChartData.datasets = [
          {
            label: "Service Degradation (%)",
            data: [serviceDegradation, 40.5, 65.2, 45.8],
            backgroundColor: [
              "rgba(59, 130, 246, 0.7)",
              "rgba(16, 185, 129, 0.7)",
              "rgba(239, 68, 68, 0.7)",
              "rgba(245, 158, 11, 0.7)",
            ],
            borderColor: ["rgb(59, 130, 246)", "rgb(16, 185, 129)", "rgb(239, 68, 68)", "rgb(245, 158, 11)"],
            borderWidth: 1,
          },
        ]

        securityChartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: "Service Degradation (%)",
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: "DoS Attack Resistance Comparison",
              font: {
                size: 16,
                weight: "bold",
              },
            },
          },
        }
        break

      default:
        vizEl.classList.add("hidden")
        return
    }

    // Create the charts
    attackChart = new Chart(chartEl, {
      type: chartType,
      data: chartData,
      options: chartOptions,
    })

    securityComparisonChart = new Chart(securityChartEl, {
      type: "bar",
      data: securityChartData,
      options: securityChartOptions,
    })
  }

  // Decrypt button handler
  document.getElementById("decryptBtn").addEventListener("click", async () => {
    if (!currentCiphertext) {
      alert("No encrypted message to decrypt")
      return
    }

    const button = document.getElementById("decryptBtn")
    const originalText = button.innerHTML
    button.innerHTML =
      '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Decrypting...'
    button.disabled = true

    // Record start time
    const decryptionStartTime = performance.now()

    try {
      // Use the server's decryption endpoint
      const response = await fetch("/decrypt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ciphertext: currentCiphertext,
          mode: currentMode
        })
      });

      if (!response.ok) {
        throw new Error("Decryption failed: " + response.statusText);
      }

      const result = await response.json();
      
      // Get the plaintext from the server response
      const plaintext = result.plaintext;

      // Calculate decryption time
      const decryptionTime = performance.now() - decryptionStartTime

      // Update UI
      document.getElementById("plainText").textContent = plaintext
      document.getElementById("decryptionTime").textContent = `Decryption time: ${decryptionTime.toFixed(2)} ms`

      // Animate plaintext appearance
      anime({
        targets: "#plainText",
        opacity: [0, 1],
        duration: 800,
        easing: "easeOutQuad",
      })

      // Re-enable button
      button.innerHTML = originalText
      button.disabled = false
    } catch (error) {
      console.error("Decryption error:", error)
      alert("Error during decryption: " + error.message)
      button.innerHTML = originalText
      button.disabled = false
    }
  })

  // Simulate encryption details for visualization
  function simulateEncryptionDetails(input, mode) {
    // Generate random keys
    const lfsrSeed = Math.floor(Math.random() * 65536)
    const chaoticX0 = Math.random()
    const chaoticR = 3.9
    const transpositionKey = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")

    // Display keys
    document.getElementById("lfsrSeedDisplay").textContent = `0x${lfsrSeed.toString(16).padStart(4, "0")}`
    document.getElementById("chaoticParamsDisplay").textContent =
      `x₀: ${chaoticX0.toFixed(6)}, r: ${chaoticR.toFixed(2)}`
    document.getElementById("transpositionKeyDisplay").textContent = `0x${transpositionKey}`

    // Display ZTM keys if in ZTM mode
    if (mode === "ztm") {
      const chachaKey = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
      const speckKey = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
      document.getElementById("ztmKeysDisplay").textContent =
        `ChaCha20 Key: 0x${chachaKey.substring(0, 16)}...\nSpeck Key: 0x${speckKey}`
      document.getElementById("ztmKeysContainer").classList.remove("hidden")
      document.getElementById("step6").classList.remove("hidden")
    } else {
      document.getElementById("ztmKeysContainer").classList.add("hidden")
      document.getElementById("step6").classList.add("hidden")
    }

    // Display original text
    document.getElementById("originalTextDisplay").textContent = input

    // Convert to binary
    const binaryInput = textToBinary(input)
    document.getElementById("binaryDisplay").textContent = binaryInput

    // LFSR configuration
    document.getElementById("lfsrSeedValue").textContent = `0x${lfsrSeed.toString(16).padStart(4, "0")}`

    // Generate LFSR keystream
    const lfsrKeystream = generateRandomBits(binaryInput.length)
    document.getElementById("lfsrKeystream").textContent = formatBitsWithSpaces(lfsrKeystream)
    document.getElementById("lfsrInput").textContent = formatBitsWithSpaces(binaryInput.replace(/\s/g, ""))

    // XOR to get LFSR output
    const lfsrOutput = xorBits(binaryInput.replace(/\s/g, ""), lfsrKeystream)
    document.getElementById("lfsrOutput").textContent = formatBitsWithSpaces(lfsrOutput)

    // Display bit-level XOR operation
    const displayLength = Math.min(24, binaryInput.replace(/\s/g, "").length)
    document.getElementById("lfsrBitInput").textContent = binaryInput.replace(/\s/g, "").substring(0, displayLength)
    document.getElementById("lfsrBitStream").textContent = lfsrKeystream.substring(0, displayLength)
    document.getElementById("lfsrBitOutput").textContent = lfsrOutput.substring(0, displayLength)

    // Chaotic map configuration
    document.getElementById("chaoticX0Value").textContent = chaoticX0.toFixed(6)
    document.getElementById("chaoticRValue").textContent = chaoticR.toFixed(2)

    // Generate chaotic keystream
    const chaoticKeystream = generateRandomBits(lfsrOutput.length)
    document.getElementById("chaoticKeystream").textContent = formatBitsWithSpaces(chaoticKeystream)
    document.getElementById("chaoticInput").textContent = formatBitsWithSpaces(lfsrOutput)

    // XOR to get chaotic output
    const chaoticOutput = xorBits(lfsrOutput, chaoticKeystream)
    document.getElementById("chaoticOutput").textContent = formatBitsWithSpaces(chaoticOutput)

    // Display bit-level XOR operation for chaotic
    document.getElementById("chaoticBitInput").textContent = lfsrOutput.substring(0, displayLength)
    document.getElementById("chaoticBitStream").textContent = chaoticKeystream.substring(0, displayLength)
    document.getElementById("chaoticBitOutput").textContent = chaoticOutput.substring(0, displayLength)

    // Transposition configuration
    document.getElementById("transpositionKeyValue").textContent = `0x${transpositionKey}`

    // Display transposition input/output
    document.getElementById("transpositionInput").textContent = formatBitsWithSpaces(chaoticOutput)

    // Simulate transposition
    const transpositionOutput = simulateTransposition(chaoticOutput)
    document.getElementById("transpositionOutput").textContent = formatBitsWithSpaces(transpositionOutput)

    // ZTM mode - ChaCha20 and Speck
    if (mode === "ztm") {
      // ChaCha20 encryption
      const chachaKey = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
      const speckKey = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
      document.getElementById("ztmKeysDisplay").textContent =
        `ChaCha20 Key: 0x${chachaKey.substring(0, 16)}...\nSpeck Key: 0x${speckKey}`
      document.getElementById("ztmKeysContainer").classList.remove("hidden")
      document.getElementById("step6").classList.remove("hidden")

      // Simulate ChaCha20 encryption (using XOR for demo)
      const chachaKeystream = generateRandomBits(transpositionOutput.length)
      const chachaOutput = xorBits(transpositionOutput, chachaKeystream)
      
      // Speck encryption
      document.getElementById("speckKeyValue").textContent = `0x${speckKey}`
      document.getElementById("speckInput").textContent = formatBitsWithSpaces(chachaOutput)

      // Simulate Speck output
      const speckOutput = simulateTransposition(chachaOutput) // Just another transposition for demo
      document.getElementById("speckOutput").textContent = formatBitsWithSpaces(speckOutput)

      // Final output
      document.getElementById("finalBinary").textContent = formatBitsWithSpaces(speckOutput)
      document.getElementById("finalHex").textContent = binaryToHex(speckOutput)
      document.getElementById("finalBase64").textContent = btoa(binaryToText(speckOutput))
    } else {
      // Final output
      document.getElementById("finalBinary").textContent = formatBitsWithSpaces(transpositionOutput)
      document.getElementById("finalHex").textContent = binaryToHex(transpositionOutput)
      document.getElementById("finalBase64").textContent = btoa(binaryToText(transpositionOutput))
    }
  }

  // Animate the encryption process visualizer
  function animateEncryptionProcess(mode) {
    // Update process status
    document.getElementById("processStatus").textContent = "Encrypting..."
    document.getElementById("processStatus").classList.add("loading-pulse")

    // Show/hide ZTM specific elements
    document.querySelectorAll(".ztm-only").forEach((el) => {
      if (mode === "ztm") {
        el.classList.remove("hidden")
      } else {
        el.classList.add("hidden")
      }
    })

    // Update step 2 label for ZTM mode
    document.getElementById("step2Label").textContent = mode === "ztm" ? "ChaCha20" : "LFSR"

    // Animation for process steps
    anime
      .timeline({
        easing: "easeOutExpo",
        duration: 400,
        complete: () => {
          // Update status when animation completes
          document.getElementById("processStatus").textContent = "Encryption Complete"
          document.getElementById("processStatus").classList.remove("loading-pulse")
        },
      })
      .add({
        targets: "#step1",
        scale: [0, 1],
        rotateZ: ["-45deg", "0deg"],
        backgroundColor: {
          value: ["rgba(219, 234, 254, 1)", "rgba(147, 197, 253, 0.5)"],
          duration: 800,
          easing: "easeOutExpo",
        },
      })
      .add(
        {
          targets: "#step2",
          scale: [0, 1],
          rotateZ: ["-45deg", "0deg"],
          backgroundColor: {
            value: ["rgba(219, 234, 254, 1)", "rgba(147, 197, 253, 0.5)"],
            duration: 800,
            easing: "easeOutExpo",
          },
        },
        "-=200",
      )
      .add(
        {
          targets: "#step3",
          scale: [0, 1],
          rotateZ: ["-45deg", "0deg"],
          backgroundColor: {
            value: ["rgba(219, 234, 254, 1)", "rgba(147, 197, 253, 0.5)"],
            duration: 800,
            easing: "easeOutExpo",
          },
        },
        "-=200",
      )
      .add(
        {
          targets: "#step4",
          scale: [0, 1],
          rotateZ: ["-45deg", "0deg"],
          backgroundColor: {
            value: ["rgba(219, 234, 254, 1)", "rgba(147, 197, 253, 0.5)"],
            duration: 800,
            easing: "easeOutExpo",
          },
        },
        "-=200",
      )

    if (mode === "ztm") {
      anime({
        targets: "#step5",
        scale: [0, 1],
        rotateZ: ["-45deg", "0deg"],
        backgroundColor: {
          value: ["rgba(219, 234, 254, 1)", "rgba(147, 197, 253, 0.5)"],
          duration: 800,
          easing: "easeOutExpo",
        },
        delay: 1000,
      })
    }
  }

  // Step descriptions for the information panel
  const stepInfo = [
    {
      title: "Key Generation",
      description: "NTRU-based asymmetric cryptography creates secure key pairs that are resistant to quantum attacks.",
      icon: "🔑",
    },
    {
      title: "LFSR Stream",
      description: "Linear Feedback Shift Register produces pseudo-random bit sequences with long periods.",
      icon: "⏱️",
    },
    {
      title: "Chaotic Map",
      description: "Applies chaotic mathematical functions to introduce high-entropy randomness into the cipher.",
      icon: "🔄",
    },
    {
      title: "Transposition",
      description: "Permutes bit positions according to a key-dependent algorithm, improving diffusion properties.",
      icon: "↔️",
    },
    {
      title: "Speck CTR",
      description: "Lightweight block cipher operating in counter mode for the final encryption layer.",
      icon: "🔒",
    },
  ]

  // 3D Visualization globals
  let threeScene, threeCamera, threeRenderer
  let dataCube, particleSystem
  let animationRunning = false
  let currentStep = 0

  // Initialize Three.js scene
  function initThreeJS() {
    if (!document.getElementById("encryptionCanvas")) return

    // Create scene
    threeScene = new THREE.Scene()
    threeCamera = new THREE.PerspectiveCamera(75, 300 / 200, 0.1, 1000)
    threeRenderer = new THREE.WebGLRenderer({
      canvas: document.getElementById("encryptionCanvas"),
      alpha: true,
      antialias: true,
    })

    threeRenderer.setSize(300, 200)
    threeCamera.position.z = 5

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    threeScene.add(ambientLight)

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    threeScene.add(directionalLight)

    // Create data cube that will be "encrypted"
    const geometry = new THREE.BoxGeometry(2, 2, 2)
    const material = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.8,
      wireframe: false,
    })

    dataCube = new THREE.Mesh(geometry, material)
    threeScene.add(dataCube)

    // Add particle system representing encryption bits
    const particlesGeometry = new THREE.BufferGeometry()
    const particleCount = 100
    const posArray = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3))

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x00ff00,
      transparent: true,
      opacity: 0.7,
    })

    particleSystem = new THREE.Points(particlesGeometry, particlesMaterial)
    particleSystem.visible = false
    threeScene.add(particleSystem)

    // Animation loop
    function animate() {
      requestAnimationFrame(animate)
      dataCube.rotation.x += 0.01
      dataCube.rotation.y += 0.01
      threeRenderer.render(threeScene, threeCamera)
    }

    animate()
  }

  // Handle starting the encryption animation
  function startEncryptionVisualization() {
    if (animationRunning) return
    animationRunning = true
    currentStep = 0

    // Update button state
    const button = document.getElementById("startVisualizationBtn")
    button.disabled = true
    button.innerHTML =
      '<svg class="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...'

    // Reset appearance
    dataCube.material.color.set(0x3b82f6)
    dataCube.material.wireframe = false
    particleSystem.visible = false

    // Reset visualization steps
    document.getElementById("visProcessComplete").style.opacity = 0

    // Update information panel
    updateInfoPanel(0)

    // Start animation sequence
    const timeline = anime.timeline({
      easing: "easeInOutSine",
      complete: () => {
        animationRunning = false
        button.disabled = false
        button.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg> Restart Encryption'
      },
    })

    // Step 1: Key Generation
    timeline.add({
      targets: ".vis-step-1",
      scale: [0, 1],
      backgroundColor: {
        value: ["rgba(55, 65, 81, 0.8)", "rgba(59, 130, 246, 0.8)"],
        easing: "easeInOutQuad",
      },
      duration: 800,
      begin: () => {
        currentStep = 0
        updateInfoPanel(currentStep)
        document.getElementById("visProcessStatus").textContent = "Processing: Key Generation"
        dataCube.material.color.set(0x3b82f6)
        dataCube.scale.set(1, 1, 1)
      },
    })

    // Step 2: LFSR or ChaCha20
    timeline.add({
      targets: ".vis-step-2",
      scale: [0, 1],
      backgroundColor: {
        value: ["rgba(55, 65, 81, 0.8)", "rgba(59, 130, 246, 0.8)"],
        easing: "easeInOutQuad",
      },
      duration: 800,
      begin: () => {
        currentStep = 1
        updateInfoPanel(currentStep)
        const mode = document.getElementById("mode").value
        document.getElementById("visProcessStatus").textContent = mode === "ztm" ? "Processing: ChaCha20" : "Processing: LFSR Stream"
        particleSystem.visible = true
        dataCube.material.color.set(0x60a5fa)
      },
    })

    // Step 3: LFSR (only in ZTM mode)
    if (document.getElementById("mode").value === "ztm") {
      timeline.add({
        targets: ".vis-step-3",
        scale: [0, 1],
        backgroundColor: {
          value: ["rgba(55, 65, 81, 0.8)", "rgba(59, 130, 246, 0.8)"],
          easing: "easeInOutQuad",
        },
        duration: 800,
        begin: () => {
          currentStep = 2
          updateInfoPanel(currentStep)
          document.getElementById("visProcessStatus").textContent = "Processing: LFSR Stream"
          dataCube.material.wireframe = true
          dataCube.material.color.set(0x60a5fa)
        },
      })
    }

    // Step 4: Chaotic Map
    timeline.add({
      targets: ".vis-step-3",
      scale: [0, 1],
      backgroundColor: {
        value: ["rgba(55, 65, 81, 0.8)", "rgba(59, 130, 246, 0.8)"],
        easing: "easeInOutQuad",
      },
      duration: 800,
      begin: () => {
        currentStep = document.getElementById("mode").value === "ztm" ? 3 : 2
        updateInfoPanel(currentStep)
        document.getElementById("visProcessStatus").textContent = "Processing: Chaotic Map"
        dataCube.material.wireframe = true
        // Add extra rotation
        anime({
          targets: dataCube.rotation,
          x: dataCube.rotation.x + Math.PI,
          y: dataCube.rotation.y + Math.PI,
          duration: 1000,
          easing: "easeInOutQuad",
        })
      },
    })

    // Step 5: Transposition
    timeline.add({
      targets: ".vis-step-4",
      scale: [0, 1],
      backgroundColor: {
        value: ["rgba(55, 65, 81, 0.8)", "rgba(59, 130, 246, 0.8)"],
        easing: "easeInOutQuad",
      },
      duration: 800,
      begin: () => {
        currentStep = document.getElementById("mode").value === "ztm" ? 4 : 3
        updateInfoPanel(currentStep)
        document.getElementById("visProcessStatus").textContent = "Processing: Transposition"
        // Animate cube scale
        anime({
          targets: { x: dataCube.scale.x, y: dataCube.scale.y, z: dataCube.scale.z },
          x: [1, 1.2, 0.8, 1],
          y: [1, 0.8, 1.2, 1],
          z: [1, 1.1, 0.9, 1],
          duration: 1000,
          easing: "easeInOutQuad",
          update: (anim) => {
            const vals = anim.animatables[0].target
            dataCube.scale.set(vals.x, vals.y, vals.z)
          },
        })
      },
    })

    // Only add Speck CTR step for ZTM mode
    if (document.getElementById("mode").value === "ztm") {
      timeline.add({
        targets: ".vis-step-5",
        scale: [0, 1],
        backgroundColor: {
          value: ["rgba(55, 65, 81, 0.8)", "rgba(59, 130, 246, 0.8)"],
          easing: "easeInOutQuad",
        },
        duration: 800,
        begin: () => {
          currentStep = 5
          updateInfoPanel(currentStep)
          document.getElementById("visProcessStatus").textContent = "Processing: Speck CTR"
          dataCube.material.wireframe = false
          dataCube.material.color.set(0x10b981)
        },
      })
    }

    // Completion
    timeline.add({
      targets: "#visProcessComplete",
      opacity: [0, 1],
      duration: 800,
      begin: () => {
        document.getElementById("visProcessStatus").textContent = "Process Complete"
        // Final animation for the cube
        anime({
          targets: { x: dataCube.scale.x, y: dataCube.scale.y, z: dataCube.scale.z },
          x: 1.1,
          y: 1.1,
          z: 1.1,
          duration: 600,
          easing: "easeOutElastic",
          update: (anim) => {
            const vals = anim.animatables[0].target
            dataCube.scale.set(vals.x, vals.y, vals.z)
          },
        })
      },
    })
  }

  // Update information panel with current step details
  function updateInfoPanel(stepIndex) {
    const step = stepInfo[stepIndex]
    document.getElementById("visStepIcon").textContent = step.icon
    document.getElementById("visStepTitle").textContent = step.title
    document.getElementById("visStepDescription").textContent = step.description
  }

  // Utility functions
  function textToBinary(text) {
    let result = ""
    for (let i = 0; i < text.length; i++) {
      const binary = text.charCodeAt(i).toString(2).padStart(8, "0")
      result += binary + " "
    }
    return result.trim()
  }

  function binaryToText(binary) {
    binary = binary.replace(/\s/g, "")
    let result = ""
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.substr(i, 8)
      result += String.fromCharCode(Number.parseInt(byte, 2))
    }
    return result
  }

  function binaryToHex(binary) {
    binary = binary.replace(/\s/g, "")
    let result = ""
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.substr(i, 8)
      const hex = Number.parseInt(byte, 2).toString(16).padStart(2, "0")
      result += hex + " "
    }
    return result.trim()
  }

  function generateRandomBits(length) {
    let result = ""
    for (let i = 0; i < length; i++) {
      result += Math.round(Math.random()).toString()
    }
    return result
  }

  function xorBits(a, b) {
    let result = ""
    for (let i = 0; i < a.length && i < b.length; i++) {
      result += (Number.parseInt(a[i]) ^ Number.parseInt(b[i])).toString()
    }
    return result
  }

  function formatBitsWithSpaces(bits) {
    let result = ""
    for (let i = 0; i < bits.length; i += 8) {
      result += bits.substr(i, 8) + " "
    }
    return result.trim()
  }

  function simulateTransposition(binary) {
    // Simple transposition for demo purposes
    binary = binary.replace(/\s/g, "")
    let result = ""
    for (let i = 0; i < binary.length; i += 2) {
      if (i + 1 < binary.length) {
        result += binary[i + 1] + binary[i]
      } else {
        result += binary[i]
      }
    }
    return result
  }

  // Initialize Three.js visualization when the page loads
  if (typeof THREE !== "undefined") {
    initThreeJS()
  } else {
    // Load Three.js if not already loaded
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js"
    script.onload = initThreeJS
    document.head.appendChild(script)
  }

  // Button to start the advanced visualization
  document.getElementById("startVisualizationBtn")?.addEventListener("click", startEncryptionVisualization)
})
