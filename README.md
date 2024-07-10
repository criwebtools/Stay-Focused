![example workflow](https://github.com/criwebtools/Stay-Focused/actions/workflows/codeql-analysis.yml/badge.svg)
![example workflow](https://github.com/criwebtools/Stay-Focused/actions/workflows/sonarcloud.yml/badge.svg)

# Stay Focused!
Version 1.0.3   
July 2024  
Pete Charpentier  
https://portal.redcap.yale.edu  
redcap@yale.edu

### What does it do?
The Stay Focused! external module does just three things, all meant to help you manage the situation 
in which you must periodically save your work as you conduct an interview or enter a long REDCap form:
1. After you have clicked **Save & Stay** and the page reloads, the form is repositioned to the last field you entered.  

2. It marks the place where you left off with a bright blue horizontal bar, so that you can track
how much data entry or data collection you have performed since your last save.

3. It suppresses the post-save display of the popup dialog alerting you to required fields that are blank.
This alert is not useful in the Save & Stay context because there will almost certainly be required but blank fields,
since the data entry is in progress. More importantly, it can interrupt the flow of an interview. 
The post-save popup dialog *will* be displayed under any other Save context (Save & Exit, Save & Next Form).

### Example
In the screen shot below, the user is conducting a medical record abstraction. He has been instructed to periodically click the **Save & Stay** button to guard against data loss from a wobbly Internet connection.

After completing a section of the form, he decides to save his work. Here is the form before he clicks
the **Save & Stay** button: 

<img src="./images/stay_focused_before_save.png" alt="image of form before save and stay" />

After he clicks **Save & Stay** the page refreshes as usual, but instead of
the focus returning to the top of the form, the form scrolls
to the same location where he left off, and identifies the last data entered with partial blue border.

<img src="./images/stay_focused_after_save.png" alt="image of form after page reload following save and stay" />

### How it works
Stay Focused! works by detecting non-blank data entry and clicks on special links like file upload and econsent, and remembering enough information about the last field entered to identify it after reload. The current window scroll position is also remembered, so that the window can scroll to the same location after reload.
When either the bottom or the "floating" **Save & Stay** button is clicked, Stay Focused! Saves information about the last field entered or updated into a "localStorage" item, which is a Javascript data storage resource that persists between browser sessions. 
After the page is reloaded the properties of the last field is retrieved from localStorage, the form is scrolled to the proper
location, and the data entry boundary is marked with a border having the same blue color as the Save&Stay button.

> PLEASE NOTE  
> Stay Focused! makes certain assumptions about the REDCap data entry form user interface, which may change over time. There is a possibility that Stay Focused! and REDCap will drift apart at some point, due to changes in the REDCap UI. If Stay Focused! is not working for you, please get in touch with us at redcap@yale.edu. This version of Stay Focused! was tested on REDCap version 14.4.1 and LTS 14.0.32 on July 5, 2024.

## Change Log

| version | date | description |  
| ------- | ---- | ----------- |
| 1.0.2   | 2024-07-05 | Fixes fatal error on install caused by mismatch in config.json between class name and namespace. |
| 1.0.1 | 2024-06-27 | updated for compatibility with current REDCap UI (LTS 14.0.32, 14.4.1) |


