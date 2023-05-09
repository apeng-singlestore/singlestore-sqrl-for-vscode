// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as dotenv from 'dotenv';
import * as mysql from 'mysql2/promise';
import { Parser } from 'node-sql-parser';

import * as fs from 'fs';

const envPath = __dirname + '/.env';
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, "");
}

const result = dotenv.config({path: envPath});
// eslint-disable-next-line @typescript-eslint/naming-convention
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	// Check if .env file is updated with configuration details
	const envFile = await vscode.workspace.fs.readFile(vscode.Uri.file(__dirname + "/.env"));
	const envContent = envFile.toString();
	if (!envContent.includes("OPENAI_API_KEY") || !envContent.includes("DB_NAME") || !envContent.includes("DB_HOST") || !envContent.includes("DB_USER") || !envContent.includes("DB_PASSWORD")) {
		openConfigurationPage();
	}
	
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	// Function to get the HTML content of the webview panel
	function getWebviewContent() {
		const nonce = getNonce();
		const envConfig = dotenv.config({path: envPath}).parsed;
		const openaiKey = envConfig?.OPENAI_API_KEY || '';
		const dbName = envConfig?.DB_NAME || '';
		const dbHost = envConfig?.DB_HOST || '';
		const dbUser = envConfig?.DB_USER || '';
		const dbPassword = envConfig?.DB_PASSWORD || '';
		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${nonce}';">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>SingleStore SQRL for VSCode Configurationı</title>
		</head>
		<body>
			<h1>SingleStore SQRL for VSCode Configuration</h1>
			<div style="display: flex; flex-direction: row;">
				<form id="configForm">
					<label for="openaiKey">OpenAI API Key:</label>
					<input type="text" id="openaiKey" name="openaiKey" value=${openaiKey} required><br><br>
					<label for="dbName">Database Name:</label>
					<input type="text" id="dbName" name="dbName" value=${dbName} required><br><br>
					<label for="dbHost">Database Host:</label>
					<input type="text" id="dbHost" name="dbHost" value=${dbHost} required><br><br>
					<label for="dbUser">Database User:</label>
					<input type="text" id="dbUser" name="dbUser" value=${dbUser} required><br><br>
					<label for="dbPassword">Database Password:</label>
					<input type="password" id="dbPassword" name="dbPassword" required><br><br>
					<input type="submit" value="Save Configuration">
				</form>
				<button id='signupButton'>Signup for SingleStore</button>
			</div>
			<script nonce="${nonce}">
				const vscode = acquireVsCodeApi();
				const configForm = document.getElementById('configForm');
				const signupButton = document.getElementById('signupButton');
				configForm.addEventListener('submit', (event) => {
					event.preventDefault();
					const openaiKey = document.getElementById('openaiKey').value;
					const dbName = document.getElementById('dbName').value;
					const dbHost = document.getElementById('dbHost').value;
					const dbUser = document.getElementById('dbUser').value;
					const dbPassword = document.getElementById('dbPassword').value;
					vscode.postMessage({
						type: 'saveConfig',
						openaiKey,
						dbName,
						dbHost,
						dbUser,
						dbPassword
					});
				});
				signupButton.addEventListener('click', () => {
					vscode.postMessage({
						type: 'signup'
					});
				});
				function getNonce() {
					let text = "";
					const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
					for (let i = 0; i < 32; i++) {
					text += possible.charAt(Math.floor(Math.random() * possible.length));
					}
					return text;
				}
			</script>
		</body>
		</html>`;

	}



	function getNonce() {
		let text = "";
		const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
	let db: any;
	async function openConfigurationPage() {
		// Create a webview panel for configuration
		const panel = vscode.window.createWebviewPanel(
			'singlestore-sqrl-for-vscode.configuration',
			'SingleStore SQL Helper Configuration',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(context.extensionPath)]
			}
		);

		// Load the HTML content of the webview panel
		panel.webview.html = getWebviewContent();
		
		
		// Handle messages sent from the webview panel
		panel.webview.onDidReceiveMessage(async (message) => {
			if (message.type === 'saveConfig') {
				// Validate the connection before saving the configuration to the .env file
				try {
					db = await mysql.createConnection({
						host: message.dbHost,
						user: message.dbUser,
						password: message.dbPassword,
						database: message.dbName
					});

					if (db) {
						const envContent = `OPENAI_API_KEY=${message.openaiKey}\nDB_NAME=${message.dbName}\nDB_HOST=${message.dbHost}\nDB_USER=${message.dbUser}\nDB_PASSWORD=\"${message.dbPassword}\"`;

						await vscode.workspace.fs.writeFile(vscode.Uri.file(__dirname + "/.env"), Buffer.from(envContent));

						const result = dotenv.config({path: envPath});
						// Show a success message					
						vscode.window.showInformationMessage('Configuration saved successfully! Please reload VSCode.');
					} 
				} catch (error) {
					vscode.window.showErrorMessage('Failed to connect to the database. Please check your credentials and try again.');
				}

			}
			if(message.type === 'signup') {
				vscode.env.openExternal(vscode.Uri.parse('https://www.singlestore.com/cloud-trial/?utm_source=singlestore&utm_medium=web&utm_campaign=&campaignid=7014X000001yp4JQAQ'));
				vscode.window.showInformationMessage('Signed up!');
			}
		});
	}

	let openConfigurationPageDisposable = vscode.commands.registerCommand('singlestore-sqrl-for-vscode.openConfigurationPage', openConfigurationPage);
	let disposable = vscode.commands.registerCommand('singlestore-sqrl-for-vscode.transformCommentToSQL', async () => {
		// Get the active text editor
		const editor = vscode.window.activeTextEditor;
		if (editor && editor.document.languageId === 'sql') { // Check if the active file is a SQL file
			// Get the selected text
			const selectedText = editor.document.getText(editor.selection);

			// Check if /SQRL is typed
			const sqrlIndex = selectedText.lastIndexOf('/SQRL');
			if (sqrlIndex !== -1) {
				const range = new vscode.Range(
					editor.document.positionAt(sqrlIndex),
					editor.document.positionAt(sqrlIndex + 5)
				);

				// Get the text after /SQRL
				const commentContent = selectedText.slice(sqrlIndex + 5);
				const config = dotenv.config({path: envPath});
				console.log(config);
				try {
					db = await mysql.createConnection({
						host: process.env.DB_HOST,
						user: process.env.DB_USER,
						password: process.env.DB_PASSWORD,
						database: process.env.DB_NAME
					});
				} catch (error) {
					console.log(db);
					vscode.window.showErrorMessage('Please configure your database connection before using this command.');
					openConfigurationPage();
					return;
				} 

				let result = await execute(db, 'SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=' + '\"' + process.env.DB_NAME + '\"');
				const tableSchema = JSON.stringify(result);
				console.log('trying result');
				console.log(result);
				console.log(process.env.DB_NAME);
				console.log(db);
				// Use openai.createChatCompletion to transform the comment into SQL code
				const response = await openai.createChatCompletion({
					model: "gpt-3.5-turbo",
					messages: [{role: "user", content: `Transform this comment into SQL code: ${commentContent}. Use this as a table schema: ${tableSchema}.`}],
				});

				// Get the generated SQL code
				const sqlCode = response.data.choices[0].message.content;

				// Use a regular expression to check if the SQL code is pure SQL
				const parser = new Parser();
				try {
					const ast = parser.astify(sqlCode);
					console.log(ast)
				} catch (error) {
					vscode.window.showErrorMessage('Invalid SQL code. Please retry.');
					vscode.window.showErrorMessage(sqlCode);
					return;
				}
				// Replace the text after /SQRL with the generated SQL code
				editor.edit((editBuilder) => {
					const range = editor.selection;
					editBuilder.replace(range, sqlCode.replace(/\n/g, ' '));
				});

			} else {
				vscode.window.showErrorMessage('Please type /SQRL followed by a comment to transform.');
			}
			
		} else {
			vscode.window.showErrorMessage('Please open a SQL file to use this command.');
		}
	});


	let executeCommandDisposable = vscode.commands.registerCommand('singlestore-sqrl-for-vscode.executeCommand', async () => {
		// Get the active text editor
		const editor = vscode.window.activeTextEditor;
		if (editor && editor.document.languageId === 'sql') { // Check if the active file is a SQL file
			// Get the selected text
			const selectedText = editor.document.getText(editor.selection);
			try {
				db = await mysql.createConnection({
					host: process.env.DB_HOST,
					user: process.env.DB_USER,
					password: process.env.DB_PASSWORD,
					database: process.env.DB_NAME
				});
			} catch (error) {
				vscode.window.showErrorMessage('Please configure your database connection before using this command.');
				openConfigurationPage();
				return;
			}
			await executeAndShowResults(db, selectedText);
		} else {
			vscode.window.showErrorMessage('Please open a SQL file to use this command.');
		}
	});

	async function execute(conn: any, command: string) {
		const [rows] = await conn.execute(
			command
		);
		return rows;
	};

	async function executeAndShowResults(conn: any, command: string) {
		console.log("got to execute and show");
		// Execute the SQL query
		const [rows] = await conn.execute(command);
		console.log("got to rows");
		console.log(rows);

		// Create a new webview panel to show the results
		const panel = vscode.window.createWebviewPanel(
			'singlestore-sqrl-for-vscode.results',
			'SingleStore SQL Helper Results',
			vscode.ViewColumn.Two,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(context.extensionPath)]
			}
		);

		// Load the HTML content of the webview panel
		panel.webview.html = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>SingleStore SQL Helper Results</title>
				<style>
					table {
						border-collapse: collapse;
						width: 100%;
					}

					th, td {
						text-align: left;
						padding: 8px;
					}

					tr:nth-child(even) {
						background-color: #595858;
					}

					th {
						background-color: #AA00FF;
						color: white;
					}
				</style>
			</head>
			<body>
				<h1>Command</h1>
				<pre><code class="language-sql">${command}</code></pre>
				<h1>Results</h1>
				<table>
					<thead>
						<tr>
							${Object.keys(rows[0]).map((key: string) => `<th>${key}</th>`).join('')}
						</tr>
					</thead>
					<tbody>
						${rows.map((row: any) => `<tr>${Object.values(row).map((value: any) => `<td>${value}</td>`).join('')}</tr>`).join('')}
					</tbody>
				</table>
			</body>
			</html>

		`;
	}

	context.subscriptions.push(executeCommandDisposable);
	context.subscriptions.push(openConfigurationPageDisposable);
	context.subscriptions.push(disposable);
	
}

// This method is called when your extension is deactivated
export function deactivate() {}
