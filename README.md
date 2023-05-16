# SingleStore SQrL for VSCode

SingleStore SQrL makes working with your SingleStore database in VSCode magical. 

## Features

1. Translate natural language queries to SQL code! Simply write a SQL comment ("--" followed by your question or description) to have your answer in SQL code.
2. Execute SQL code on a connected SingleStore database and view the results.

## Installation

To retrieve your SingleStore database connection credentials, follow these steps:

1. Sign in to SingleStore
2. Select 'Workspaces' under Cloud on the left panel
3. Select the three-dot menu under 'Actions' for your desired workspace.
4. Select 'Connect Directly,' 'Your App,' then 'Node.js' under the dropdown.
5. For Database Name, copy your desired database name from the 'Databases' tab
6. For username/password access, see the 'Access' tab.

# How to use

1. Open a SQL file and write '--' followed by a natural language query. Select the entire query then press Cmd + Shift + T (Mac) or Ctrl + Shift + T (Windows).
2. Inspect the query and make changes as necessary. It should automatically leverage table and column names from your SingleStore database.
3. Select the generated SQL code (or your own code) and press Cmd + Shift + R to execute the query and view results in a popup window – super fast thanks to SingleStore's industry-leading performance.

## Extension Settings

To configure the extension, use the "Open configuration page" command from the command palette.

1. Enter Cmd + Shift + P on Mac, or Ctrl + Shift + P on Windows
2. Search "Open configuration page"
3. Press enter
