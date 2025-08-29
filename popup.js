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
      filteredCookies.forEach((cookie, index) => {
        const div = document.createElement('div');
        div.className = 'cookie-item';
        div.innerHTML = `
          <input type="checkbox" id="cookie_${index}" name="cookie" value="${index}">
          <label for="cookie_${index}" id="label_${index}" class="cookie-label">
            ${cookie.customName || `Cookie ${index + 1} - ${cookie.domain}`}
          </label>
          <button class="rename-btn" data-index="${index}">Rename</button>
        `;
        cookieListContainer.appendChild(div);
      });

      // Add rename event listeners
      document.querySelectorAll('.rename-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.getAttribute('data-index'));
          const label = document.getElementById(`label_${index}`);
          const currentName = label.textContent.trim();
          const newName = prompt('Enter new name for this cookie:', currentName);
          if (newName && newName.trim() !== '') {
            chrome.storage.local.get(['cookies'], (result) => {
              const cookies = result.cookies;
              cookies[index].customName = newName.trim();
              chrome.storage.local.set({ cookies: cookies }, () => {
                updateCookieList(domainFilter.value);
              });
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

  // Download cookies as JSON
  downloadButton.addEventListener('click', () => {
    chrome.storage.local.get(['cookies'], (result) => {
      const cookies = result.cookies || [];
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cookies, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `cookies_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      alert('Cookies downloaded as JSON file!');
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
          // Validate cookie format
          const isValid = importedCookies.every(cookie => 
            cookie.domain && typeof cookie.domain === 'string' &&
            cookie.cookies && Array.isArray(cookie.cookies) &&
            cookie.timestamp && typeof cookie.timestamp === 'string'
          );
          if (!isValid) {
            alert(`Invalid cookie data in file: ${file.name}`);
            return;
          }
          allImportedCookies.push(...importedCookies);
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
        const index = parseInt(checkbox.value);
        const selectedCookies = cookies[index].cookies;
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
          const indicesToRemove = Array.from(checkboxes).map(cb => parseInt(cb.value));
          cookies = cookies.filter((_, index) => !indicesToRemove.includes(index));
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

  // Initial load
  updateCookieList();
});