import * as vscode from 'vscode';
import { getYAMLAPI, getSchemaContent, onRequestSchemaURI, META_YAML_SCHEMA_NAME } from "./yaml-schema";

export async function activate(context: vscode.ExtensionContext) {
	const yamlAPI = await getYAMLAPI();
	if (yamlAPI) {
		const resolveSchemaContent = await getSchemaContent();
		const b = () => resolveSchemaContent;
		yamlAPI.registerContributor(META_YAML_SCHEMA_NAME, onRequestSchemaURI, b);
	}
}

export function deactivate() {}
