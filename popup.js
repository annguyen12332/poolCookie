document.addEventListener('DOMContentLoaded', () => {
  const saveButton = document.getElementById('saveCookie');
  const useButton = document.getElementById('useCookie');
  const clearButton = document.getElementById('clearCookies');
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
        div.innerHTML = `
          <input type="checkbox" id="cookie_${index}" name="cookie" value="${index}">
          <label for="cookie_${index}">Cookie ${index + 1} - ${cookie.domain}</label>
        `;
        cookieListContainer.appendChild(div);
      });
    });
  }

  // Filter change event
  domainFilter.addEventListener('change', () => {
    updateCookieList(domainFilter.value);
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