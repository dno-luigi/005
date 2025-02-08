const menuButton = document.getElementById('menuButton');
    const talkButton = document.getElementById('talkButton');
    const messageInput = document.getElementById('messageInput');
    const conversation = document.getElementById('conversation');
    const applet = document.getElementById('applet');
    const closeSettings = document.getElementById('closeSettings');
    const saveSettings = document.getElementById('saveSettings');
    const modelSelect = document.getElementById('modelSelect');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const userInfoInput = document.getElementById('userInfoInput');
    const responseInstructionsInput = document.getElementById('responseInstructionsInput');
    const aiSpeechToggle = document.getElementById('aiSpeechToggle');
    const toggleMode = document.getElementById('toggleMode');
    
    let recognizing = false;
    let recognition;
    let currentUtterance = null;
    let selectedModel = 'deepseek/deepseek-r1-distill-llama-70b';
    let apiKey = '';
    let userInfo = '';
    let responseInstructions = '';
    let aiSpeechEnabled = true;
    let isDarkMode = false;
    
    if ('webkitSpeechRecognition' in window) {
      recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
    
      recognition.onstart = function() {
        recognizing = true;
        talkButton.innerHTML = '<i class="fas fa-stop"></i>';
      };
    
      recognition.onend = function() {
        recognizing = false;
        updateTalkButtonText();
      };
    
      recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
        addMessage();
      };
    
      recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
      };
    } else {
      talkButton.innerHTML = '<i class="fas fa-envelope"></i>';
      talkButton.disabled = true;
    }
    
    menuButton.addEventListener('click', () => {
      applet.classList.toggle('open');
    });
    
    closeSettings.addEventListener('click', () => {
      applet.classList.remove('open');
    });
    
    toggleMode.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      document.body.classList.toggle('light-mode');
      isDarkMode = !isDarkMode;
      const modeIcon = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
      toggleMode.innerHTML = modeIcon;
    });
    
    saveSettings.addEventListener('click', () => {
      selectedModel = modelSelect.value;
      apiKey = apiKeyInput.value;
      userInfo = userInfoInput.value;
      responseInstructions = responseInstructionsInput.value;
      aiSpeechEnabled = aiSpeechToggle.checked;
    
      localStorage.setItem('selectedModel', selectedModel);
      localStorage.setItem('apiKey', apiKey);
      localStorage.setItem('userInfo', userInfo);
      localStorage.setItem('responseInstructions', responseInstructions);
      localStorage.setItem('aiSpeechEnabled', aiSpeechEnabled.toString());
      localStorage.setItem('isDarkMode', isDarkMode);
    
      applet.classList.remove('open');
    });
    
    async function addMessage() {
      const message = messageInput.value.trim();
      if (message) {
        const userMessageElement = document.createElement('div');
        userMessageElement.classList.add('message', 'user-message');
        userMessageElement.textContent = message;
        addDeleteButton(userMessageElement); // Add delete button
        addCopyButton(userMessageElement, message); // Add copy button
        addSpeakButton(userMessageElement, message); // Add speak button
        addToggleButton(userMessageElement); // Add toggle button
        conversation.appendChild(userMessageElement);
        messageInput.value = '';
        conversation.scrollTop = conversation.scrollHeight;
    
        const typingElement = document.createElement('div');
        typingElement.classList.add('message', 'ai-message', 'typing-indicator');
        typingElement.innerHTML = `
          <span></span>
          <span></span>
          <span></span>
        `;
        conversation.appendChild(typingElement);
        conversation.scrollTop = conversation.scrollHeight;
    
        try {
          const payload = {
            model: selectedModel,
            messages: [
              { role: "system", content: `What you should know about me: ${userInfo}\nHow you will respond: ${responseInstructions}` },
              { role: "user", content: message }
            ]
          };
    
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
          });
    
          const data = await response.json();
          const aiMessageContent = data.choices[0].message.content.trim();
    
          const aiMessageElement = document.createElement('div');
          aiMessageElement.classList.add('message', 'ai-message');
          aiMessageElement.innerHTML = marked.parse(aiMessageContent);
    
          // Add delete, copy, and speak buttons
          addDeleteButton(aiMessageElement); // Add delete button
          addCopyButton(aiMessageElement, aiMessageContent); // Add copy button
          addSpeakButton(aiMessageElement, aiMessageContent); // Add speak button
          addToggleButton(aiMessageElement); // Add toggle button
    
          conversation.appendChild(aiMessageElement);
          conversation.scrollTop = conversation.scrollHeight;
    
          if (aiSpeechEnabled) {
            const utterance = new SpeechSynthesisUtterance(aiMessageContent);
            utterance.lang = 'en-US';
            speechSynthesis.speak(utterance);
          }
        } catch (error) {
          console.error('Error:', error);
          const errorMessageElement = document.createElement('div');
          errorMessageElement.classList.add('message', 'ai-message');
          errorMessageElement.textContent = `Error: ${error.message}`;
          addDeleteButton(errorMessageElement); // Add delete button
          addToggleButton(errorMessageElement); // Add toggle button
    
          conversation.appendChild(errorMessageElement);
          conversation.scrollTop = conversation.scrollHeight;
        }
        conversation.removeChild(typingElement);
      }
    }
    
    // Function to add a delete button to a message element
    function addDeleteButton(messageElement) {
      const deleteButton = document.createElement('button');
      deleteButton.classList.add('delete-button');
      deleteButton.innerHTML = '<i class="fas fa-times"></i>';
      deleteButton.addEventListener('click', () => {
        messageElement.remove();
      });
      messageElement.appendChild(deleteButton);
    }
    
    // Function to add a copy button to a message element
    function addCopyButton(messageElement, text) {
      const copyButton = document.createElement('button');
      copyButton.classList.add('copy-button');
      copyButton.innerHTML = '<i class="fas fa-copy"></i>';
      copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(text).then(() => {
          alert('Response copied to clipboard');
        }).catch((err) => {
          console.error('Could not copy text: ', err);
        });
      });
      messageElement.appendChild(copyButton);
    }
    
    // Function to add a speak button to a message element
    function addSpeakButton(messageElement, text) {
      const speakButton = document.createElement('button');
      speakButton.classList.add('speak-button');
      speakButton.innerHTML = '<i class="fas fa-volume-up"></i>';
      speakButton.addEventListener('click', () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      });
      messageElement.appendChild(speakButton);
    }
    
    // Function to add a toggle button to a message element
    function addToggleButton(messageElement) {
      const toggleButton = document.createElement('button');
      toggleButton.classList.add('message-toggle');
      toggleButton.innerHTML = '<i class="fas fa-chevron-up"></i>'; // Initial icon
      toggleButton.addEventListener('click', () => {
        messageElement.classList.toggle('expanded');
        // Change icon based on expanded state
        toggleButton.innerHTML = messageElement.classList.contains('expanded') ? '<i class="fas fa-chevron-down"></i>' : '<i class="fas fa-chevron-up"></i>';
      });
      messageElement.appendChild(toggleButton);
    }
    
    talkButton.addEventListener('click', () => {
      if (recognizing) {
        recognition.stop();
      } else if (aiSpeechEnabled && 'webkitSpeechRecognition' in window) {
        recognition.start();
      }
    });
    
    messageInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        addMessage();
      }
    });
    
    function updateTalkButtonText() {
      talkButton.innerHTML = recognizing
        ? '<i class="fas fa-stop"></i>'
        : aiSpeechEnabled && 'webkitSpeechRecognition' in window
        ? '<i class="fas fa-microphone"></i>'
        : '<i class="fas fa-envelope"></i>';
    }
    
    window.onload = () => {
      selectedModel = localStorage.getItem('selectedModel') || 'deepseek/deepseek-r1-distill-llama-70b';
      apiKey = localStorage.getItem('apiKey') || '';
      userInfo = localStorage.getItem('userInfo') || '';
      responseInstructions = localStorage.getItem('responseInstructions') || '';
      aiSpeechEnabled = localStorage.getItem('aiSpeechEnabled') === 'true';
      isDarkMode = localStorage.getItem('isDarkMode') === 'true';
    
      modelSelect.value = selectedModel;
      apiKeyInput.value = apiKey;
      userInfoInput.value = userInfo;
      responseInstructionsInput.value = responseInstructions;
      aiSpeechToggle.checked = aiSpeechEnabled;
    
      if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        toggleMode.innerHTML = '<i class="fas fa-sun"></i>';
      } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        toggleMode.innerHTML = '<i class="fas fa-moon"></i>';
      }
    
      updateTalkButtonText();
      if (!('webkitSpeechRecognition' in window)) {
        talkButton.innerHTML = '<i class="fas fa-envelope"></i>';
        talkButton.disabled = true;
      }
    };
