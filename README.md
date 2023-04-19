# A Web Music Player

## Introduction

---

## Installation
1. Install Node.js from 
   > https://nodejs.org/
2. Check if node and npm are installed:
    ~~~
    node --version
    npm --version
    yarn --version
    ~~~
   
3.  (Optional)  
    - If npm is not installed, please read
        > https://docs.npmjs.com/downloading-and-installing-node-js-and-npm  
    - If yarn is not installed, install yarn:
        ~~~
        npm install --global yarn
        ~~~
        If the following error appears
        ~~~
        yarn : PATH\TO\YOUR\npm\yarn.ps1 cannot be loaded because running scripts is disabled on this system. For more information, see about_Execution_Policies at
        https:/go.microsoft.com/fwlink/?LinkID=135170.
        At line:1 char:1
        + yarn -v
        + ~~~~
            + CategoryInfo          : SecurityError: (:) [], PSSecurityException
            + FullyQualifiedErrorId : UnauthorizedAccess
        ~~~
        1. Open PowerShell as an administrator.

        2. Run the following command to check your current execution policy:  
            ~~~
            Get-ExecutionPolicy
            ~~~

        3. This will return the current policy, which is likely set to "Restricted".

        4. To change the policy to allow script execution, run the following command:  
            ~~~ 
            Set-ExecutionPolicy RemoteSigned 
            ~~~

        5. This will allow scripts signed by a trusted publisher to be executed.  
        Confirm the change by entering "Y" when prompted.

        6. Close and reopen PowerShell, and try running the Yarn command again.
4. Install the packages from package.json:
    ~~~
    yarn install
    ~~~

---

## Usage
### **Open the app**
run:
~~~
yarn start
~~~
Your default browser should be opened and the a webpage should be displayed after the command.

### **Terminate**
please press `ctrl + c` in your terminal and close your web browser.


### gh-page
"homepage": "https://alexkkm.github.io/CSCI3280Project"

### Deploy with comment message:
yarn run deploy -- -m "Deploy React app to GitHub Pages"

## Deploy without message:
yarn run deploy
