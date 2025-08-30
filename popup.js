document.addEventListener('DOMContentLoaded', () => {
  const saveButton = document.getElementById('saveCookie');
  const useButton = document.getElementById('useCookie');
  const clearButton = document.getElementById('clearCookies');
  const downloadButton = document.getElementById('downloadCookies');
  const uploadInput = document.getElementById('uploadCookies');
  const uploadTrigger = document.getElementById('uploadTrigger');
  const fileList = document.getElementById('fileList');
  const cookieListContainer = document.getElementById('cookieListContainer');
  const domainFilter = document.getElementById('domainFilter');

  // Generate unique key for new cookies
  function generateUniqueKey() {
    return 'cookie_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Load saved cookies and update lists
  function updateCookieList(selectedDomain = 'All') {
    chrome.storage.local.get(['cookies'], (result) => {
      let cookies = result.cookies || [];
      cookies.sort((a, b) => a.domain.localeCompare(b.domain));

      const domains = [...new Set(cookies.map(c => c.domain))].sort();
      domainFilter.innerHTML = '<option value="All">All Domains</option>';
      domains.forEach(domain => {
        const option = document.createElement('option');
        option.value = domain;
        option.text = domain;
        domainFilter.appendChild(option);
      });
      domainFilter.value = selectedDomain;

      const filteredCookies = selectedDomain === 'All' ? cookies : cookies.filter(c => c.domain === selectedDomain);
      cookieListContainer.innerHTML = '';
      filteredCookies.forEach((cookie, displayIndex) => {
        const div = document.createElement('div');
        div.className = 'cookie-item';
        div.innerHTML = `
          <input type="checkbox" id="cookie_${cookie.key}" name="cookie" value="${cookie.key}">
          <label for="cookie_${cookie.key}" id="label_${cookie.key}" class="cookie-label">
            ${cookie.customName || `Cookie ${displayIndex + 1} - ${cookie.domain}`}
          </label>
          <button class="rename-btn" data-key="${cookie.key}">Rename</button>
        `;
        cookieListContainer.appendChild(div);
      });

      // Add rename event listeners
      document.querySelectorAll('.rename-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-key');
          const label = document.getElementById(`label_${key}`);
          const currentName = label.textContent.trim();
          const newName = prompt('Enter new name for this cookie:', currentName);
          if (newName && newName.trim() !== '') {
            chrome.storage.local.get(['cookies'], (result) => {
              const cookies = result.cookies;
              const cookieIndex = cookies.findIndex(c => c.key === key);
              if (cookieIndex !== -1) {
                cookies[cookieIndex].customName = newName.trim();
                chrome.storage.local.set({ cookies: cookies }, () => {
                  updateCookieList(domainFilter.value);
                });
              }
            });
          }
        });
      });
    });
  }

  // Filter change event
  domainFilter.addEventListener('change', () => {
    updateCookieList(domainFilter.value);
  });

  // Trigger file input click when upload button is clicked
  uploadTrigger.addEventListener('click', () => {
    uploadInput.click();
  });

  // Display selected file names
  uploadInput.addEventListener('change', (event) => {
    const files = event.target.files;
    fileList.innerHTML = '';
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        const div = document.createElement('div');
        div.textContent = file.name;
        fileList.appendChild(div);
      });
    }
  });

  // Save current cookies
  saveButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0].url;
      chrome.cookies.getAll({ url }, (cookies) => {
        chrome.storage.local.get(['cookies'], (result) => {
          const savedCookies = result.cookies || [];
          const newCookie = {
            key: generateUniqueKey(), // Add unique key
            domain: new URL(url).hostname,
            cookies: cookies,
            timestamp: new Date().toISOString()
          };
          savedCookies.push(newCookie);
          chrome.storage.local.set({ cookies: savedCookies }, () => {
            updateCookieList(domainFilter.value);
            alert('Cookies saved to extension!');
          });
        });
      });
    });
  });

  // Download cookies as separate JSON files
  downloadButton.addEventListener('click', () => {
    chrome.storage.local.get(['cookies'], (result) => {
      const cookies = result.cookies || [];
      if (cookies.length === 0) {
        alert('No cookies to download!');
        return;
      }
      const dateStr = new Date().toISOString().split('T')[0];
      cookies.forEach((cookie, index) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify([cookie], null, 2));
        const filename = `${cookie.customName ? cookie.customName.replace(/\s/g, '_') : `cookie_${index + 1}`}_${cookie.domain}_${dateStr}.json`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', filename);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);
      });
      alert('Cookies downloaded as separate JSON files!');
    });
  });

  // Upload and import cookies from multiple JSON files
  uploadInput.addEventListener('change', (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      alert('Please select at least one JSON file!');
      uploadInput.value = '';
      fileList.innerHTML = '';
      return;
    }

    let allImportedCookies = [];
    let filesProcessed = 0;
    const totalFiles = files.length;

    Array.from(files).forEach((file, index) => {
      if (file.type !== "application/json") {
        alert(`File ${file.name} is not a JSON file!`);
        uploadInput.value = '';
        fileList.innerHTML = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedCookies = JSON.parse(e.target.result);
          if (!Array.isArray(importedCookies)) {
            alert(`Invalid JSON format in file: ${file.name}`);
            return;
          }
          
          // Validate cookie format and add keys if missing
          const processedCookies = importedCookies.map(cookie => {
            // Validate required fields
            if (!cookie.domain || typeof cookie.domain !== 'string' ||
                !cookie.cookies || !Array.isArray(cookie.cookies) ||
                !cookie.timestamp || typeof cookie.timestamp !== 'string') {
              throw new Error('Invalid cookie data structure');
            }
            
            // Add unique key if missing (for backward compatibility)
            if (!cookie.key) {
              cookie.key = generateUniqueKey();
            }
            
            return cookie;
          });
          
          allImportedCookies.push(...processedCookies);
          filesProcessed++;

          // When all files are processed, update storage
          if (filesProcessed === totalFiles) {
            chrome.storage.local.get(['cookies'], (result) => {
              const existingCookies = result.cookies || [];
              const updatedCookies = [...existingCookies, ...allImportedCookies];
              chrome.storage.local.set({ cookies: updatedCookies }, () => {
                updateCookieList(domainFilter.value);
                alert(`Successfully imported cookies from ${totalFiles} file(s)!`);
                uploadInput.value = '';
                fileList.innerHTML = '';
              });
            });
          }
        } catch (error) {
          alert(`Error reading file ${file.name}: ${error.message}`);
          filesProcessed++;
          if (filesProcessed === totalFiles) {
            uploadInput.value = '';
            fileList.innerHTML = '';
          }
        }
      };
      reader.readAsText(file);
    });
  });

  // Use selected cookie
  useButton.addEventListener('click', () => {
    const checkboxes = cookieListContainer.querySelectorAll('input[type="checkbox"]:checked');
    if (checkboxes.length === 0) {
      alert('Please select at least one cookie to use!');
      return;
    }

    chrome.storage.local.get(['cookies'], (result) => {
      const cookies = result.cookies;
      checkboxes.forEach(checkbox => {
        const key = checkbox.value;
        const selectedCookie = cookies.find(c => c.key === key);
        if (selectedCookie) {
          const selectedCookies = selectedCookie.cookies;
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const url = tabs[0].url;
            selectedCookies.forEach((cookie) => {
              const newCookie = {
                url: url,
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain,
                path: cookie.path,
                secure: cookie.secure,
                httpOnly: cookie.httpOnly,
                expirationDate: cookie.expirationDate
              };
              chrome.cookies.set(newCookie, () => {
                if (chrome.runtime.lastError) {
                  console.error('Error setting cookie:', chrome.runtime.lastError.message);
                }
              });
            });
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              function: () => window.location.reload()
            });
          });
        }
      });
    });
  });

  // Clear selected cookies or confirm Clear All
  clearButton.addEventListener('click', () => {
    const checkboxes = cookieListContainer.querySelectorAll('input[type="checkbox"]:checked');
    if (checkboxes.length > 0) {
      if (confirm('Are you sure you want to clear the selected cookies?')) {
        chrome.storage.local.get(['cookies'], (result) => {
          let cookies = result.cookies || [];
          const keysToRemove = Array.from(checkboxes).map(cb => cb.value);
          // Filter out cookies with keys that should be removed
          cookies = cookies.filter(cookie => !keysToRemove.includes(cookie.key));
          chrome.storage.local.set({ cookies: cookies }, () => {
            updateCookieList(domainFilter.value);
            alert('Selected cookies cleared!');
          });
        });
      }
    } else {
      if (confirm('Are you sure you want to clear all cookies? This action cannot be undone!')) {
        chrome.storage.local.set({ cookies: [] }, () => {
          updateCookieList();
          alert('All cookies cleared!');
        });
      }
    }
  });

  // Migrate existing cookies to add keys (backward compatibility)
  chrome.storage.local.get(['cookies'], (result) => {
    const cookies = result.cookies || [];
    let needsMigration = false;
    
    cookies.forEach(cookie => {
      if (!cookie.key) {
        cookie.key = generateUniqueKey();
        needsMigration = true;
      }
    });
    
    if (needsMigration) {
      chrome.storage.local.set({ cookies: cookies }, () => {
        updateCookieList();
      });
    } else {
      updateCookieList();
    }
  });
});