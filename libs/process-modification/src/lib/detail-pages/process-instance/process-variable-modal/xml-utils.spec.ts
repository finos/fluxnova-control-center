import { describe, expect, it } from 'vitest';
import { cleanAndValidateXml, formatXml } from './xml-utils';

describe('xml-utils', () => {
  describe('formatXml', () => {
    it('should indent nested xml elements', () => {
      expect(formatXml('<xml><aTag><aNestedTag>A value here</aNestedTag><empty/></aTag></xml>')).toBe(
        '<xml>\n  <aTag>\n    <aNestedTag>A value here</aNestedTag>\n    <empty/>\n  </aTag>\n</xml>',
      );
    });

    it('should keep attributes, comments and CDATA and drop whitespace-only text', () => {
      expect(formatXml('<a x="1">\n  <!-- c -->\n  <b><![CDATA[<raw>]]></b>\n</a>')).toBe(
        '<a x="1">\n  <!-- c -->\n  <b><![CDATA[<raw>]]></b>\n</a>',
      );
    });

    it('should return invalid xml unchanged', () => {
      expect(formatXml('<a><b></a>')).toBe('<a><b></a>');
    });
  });

  describe('cleanAndValidateXml', () => {
    it('should flag malformed xml as invalid', () => {
      expect(cleanAndValidateXml('<a><b></a>')).toEqual({ resultXml: '<a><b></a>', isValid: false });
    });

    it('should accept well-formed xml', () => {
      expect(cleanAndValidateXml('<a/>').isValid).toBe(true);
    });
  });
});
