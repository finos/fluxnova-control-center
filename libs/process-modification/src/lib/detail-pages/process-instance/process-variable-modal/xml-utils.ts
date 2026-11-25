const domParser = new DOMParser();
const xmlSerializer = new XMLSerializer();

export function cleanAndValidateXml(xml: string): { resultXml: string; isValid: boolean } {
  const doc = domParser.parseFromString(xml, 'text/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    return { resultXml: xml, isValid: false };
  }

  return { resultXml: xmlSerializer.serializeToString(doc), isValid: true };
}

export function formatXml(unformattedString: string): string {
  const { resultXml, isValid } = cleanAndValidateXml(unformattedString);
  if (!isValid) return resultXml;

  const doc = domParser.parseFromString(resultXml, 'application/xml');
  return Array.from(doc.childNodes)
    .map((node) => formatXmlNode(node, 0))
    .filter((line) => line.length > 0)
    .join('\n');
}

function formatXmlNode(node: Node, depth: number): string {
  const indent = '  '.repeat(depth);
  if (node.nodeType === Node.TEXT_NODE) {
    const text = xmlSerializer.serializeToString(node).trim();
    return text ? indent + text : '';
  }
  const children = Array.from(node.childNodes);
  if (node.nodeType !== Node.ELEMENT_NODE || !children.some((child) => child.nodeType === Node.ELEMENT_NODE)) {
    return indent + xmlSerializer.serializeToString(node);
  }

  const openTag = xmlSerializer.serializeToString(node.cloneNode(false)).replace(/\/>$/, '>');
  const body = children
    .map((child) => formatXmlNode(child, depth + 1))
    .filter((line) => line.length > 0)
    .join('\n');
  return `${indent}${openTag}\n${body}\n${indent}</${node.nodeName}>`;
}
