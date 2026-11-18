// Background service worker for ContextFlow extension

// Load shared utilities first (they will be loaded before this script via manifest)
// The CF object is defined in shared.js which is loaded globally

// Initialize storage with default state if not exists
import './shared.js';
chrome.storage.local.get(CF.KEY, (res) => {
  if (!res[CF.KEY]) {
    chrome.storage.local.set({ [CF.KEY]: CF.freshState() });
  }
});

// Setup on installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "cf-insert-profile",
      title: "Вставить контекст-профиль ContextFlow",
      contexts: ["editable"],
    });
  });
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command !== "open-palette") return;
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) return;
    
    chrome.tabs.sendMessage(tab.id, { type: "CF_OPEN_PALETTE" }, () => {
      void chrome.runtime.lastError;
    });
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "cf-insert-profile" || !tab?.id) return;
  
  CF.load().then((state) => {
    const profile = CF.activeProfile(state);
    if (!profile) return;
    
    chrome.tabs.sendMessage(tab.id, { 
      type: "CF_INSERT", 
      text: profile.text 
    }, () => {
      void chrome.runtime.lastError;
    });
  });
});
