import * as vscode from 'vscode';
import { xhr } from 'request-light';

const VSCODE_YAML_EXTENSION_ID = 'redhat.vscode-yaml';
const META_YAML_SCHEMA_NAME = 'che-meta-yaml';

declare type YamlSchemaContributor = (schema: string,
	requestSchema: (resource: string) => string | undefined,
	requestSchemaContent: (uri: string) => string) => void;

async function getYAMLAPI(): Promise<{registerContributor: YamlSchemaContributor} | undefined> {
	const ext = vscode.extensions.getExtension(VSCODE_YAML_EXTENSION_ID);
	if (!ext) {
		vscode.window.showWarningMessage('You must have \'YAML Support by Red Hat\' in order to use this extension');
		return undefined;
	}
	const yamlPlugin = await ext.activate();
	if (!yamlPlugin || !yamlPlugin.registerContributor) {
        vscode.window.showWarningMessage('The installed Red Hat YAML extension doesn\'t support Kubernetes Intellisense. Please upgrade \'YAML Support by Red Hat\' via the Extensions pane.');
        return undefined;
	}
	return yamlPlugin;
}

function isChePluginRegistry() {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (workspaceFolders) {
		return workspaceFolders.filter(fold => fold.name.toLowerCase() === 'che-plugin-registry').length >= 1;
	}
	return false;
}

function onRequestSchemaURI(resource: string): string | undefined {
	if (isChePluginRegistry() && resource.endsWith('/meta.yaml')) {
		return `${META_YAML_SCHEMA_NAME}://schema/meta`;
	}
	return undefined;
}

const SCHEMA_URL = 'https://raw.githubusercontent.com/eclipse/che-plugin-registry/master/build/scripts/meta.yaml.schema';

async function getSchemaContent() {
	const response = await xhr({ url: SCHEMA_URL });
	const schema = JSON.parse(response.responseText);
	return schema;
}

export async function activate(context: vscode.ExtensionContext) {
	const yamlAPI = await getYAMLAPI();
	if (yamlAPI) {
		const resolveSchemaContent = await getSchemaContent();
		yamlAPI.registerContributor(META_YAML_SCHEMA_NAME, onRequestSchemaURI, () => { return JSON.stringify(resolveSchemaContent); });
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
