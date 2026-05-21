export const getDetails = (deploymentId: string) => ({
  links: [],
  id: deploymentId,
  name: 'cross-tenant-start-process-with-optional-inputs-test',
  source: 'automation',
  deploymentTime: '2024-05-20T11:55:53.342-0400',
  tenantId: null,
});

export const getDmnDiagramResource = (deploymentId: string) => ({
  id: '456',
  name: 'dmn-diagram.dmn',
  deploymentId,
});

export const getResources = (deploymentId: string) => [
  {
    id: '123',
    name: 'script.js',
    deploymentId,
  },
  {
    id: '234',
    name: 'bpmn-diagram.bpmn',
    deploymentId,
  },
  {
    id: '345',
    name: 'image.png',
    deploymentId,
  },
  getDmnDiagramResource(deploymentId),
];

export const getDecisionRequirementsDefinitionList = () => [
  {
    id: 'Definitions_19lrihq:1:79e7109a-5a7e-11ef-9174-e6d6186cf424',
    key: 'Definitions_19lrihq',
    category: 'https://fluxnova.org/schema/1.0/dmn',
    name: 'DRD',
    version: 1,
    resource: 'test.dmn',
    deploymentId: '79e4edb7-5a7e-11ef-9174-e6d6186cf424',
    tenantId: null,
  },
];

export const getDecisionDefinitionList = () =>
  [
    {
      id: 'Auto-Approval:1:79e785cc-5a7e-11ef-9174-e6d6186cf424',
      key: 'Auto-Approval',
      name: 'Automated Approval',
    },
    {
      id: 'belowThreshold:1:79e75ebb-5a7e-11ef-9174-e6d6186cf424',
      key: 'belowThreshold',
      name: 'Below Threshold',
    },
    {
      id: 'eligibleRegistration:1:79e7acdd-5a7e-11ef-9174-e6d6186cf424',
      key: 'eligibleRegistration',
      name: 'Eligible Registration',
    },
  ].map((differingPieceOfObject) => ({
    category: 'https://fluxnova.org/schema/1.0/dmn',
    version: 1,
    resource: 'test.dmn',
    deploymentId: '79e4edb7-5a7e-11ef-9174-e6d6186cf424',
    tenantId: null,
    decisionRequirementsDefinitionId: 'Definitions_19lrihq:1:79e7109a-5a7e-11ef-9174-e6d6186cf424',
    decisionRequirementsDefinitionKey: 'Definitions_19lrihq',
    historyTimeToLive: 30,
    versionTag: null,
    ...differingPieceOfObject,
  }));

export const getProcessDefinitions = (deploymentId: string) => [
  {
    id: 'Process_08i7cjm:3:6fe4f5f5-16c1-11ef-ab44-169d0edac059',
    key: 'Process_08i7cjm',
    category: 'https://bpmn.io/schema/bpmn',
    description: null,
    name: 'Cross Tenant Start Process With Optional Fields',
    version: 3,
    resource: 'cross-tenant-start-process-with-optional-fields-test.bpmn',
    deploymentId,
    diagram: null,
    suspended: false,
    tenantId: null,
    versionTag: null,
    historyTimeToLive: 180,
    startableInTasklist: true,
  },
];

export const getResourceDataJs = () => "let testing = 'this is a test string';";

export const getResourceDataBpmn = () =>
  `
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:fluxnova="http://fluxnova.org/schema/1.0/bpmn" id="Definitions_0yd3rdv" targetNamespace="http://bpmn.io/schema/bpmn" exporter="Fluxnova Modeler" exporterVersion="5.12.0">
  <bpmn:process id="Process_08pgb2n" name="Start Task End" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1">
      <bpmn:outgoing>Flow_069if4q</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:sequenceFlow id="Flow_069if4q" sourceRef="StartEvent_1" targetRef="Activity_1ss4p82" />
    <bpmn:endEvent id="Event_194crw3">
      <bpmn:incoming>Flow_1mfgi96</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1mfgi96" sourceRef="Activity_1ss4p82" targetRef="Event_194crw3" />
    <bpmn:userTask id="Activity_1ss4p82" name="Test-Task" fluxnova:asyncAfter="true">
      <bpmn:incoming>Flow_069if4q</bpmn:incoming>
      <bpmn:outgoing>Flow_1mfgi96</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:sequenceFlow id="Flow_1tcwbyq" sourceRef="Event_1loqmtz" targetRef="Event_0ls5cw8" />
    <bpmn:endEvent id="Event_0ls5cw8">
      <bpmn:incoming>Flow_1tcwbyq</bpmn:incoming>
      <bpmn:terminateEventDefinition id="TerminateEventDefinition_0pyfrgh" />
    </bpmn:endEvent>
    <bpmn:boundaryEvent id="Event_1loqmtz" attachedToRef="Activity_1ss4p82">
      <bpmn:outgoing>Flow_1tcwbyq</bpmn:outgoing>
      <bpmn:timerEventDefinition>
        <bpmn:timeDuration>PT15M</bpmn:timeDuration>
      </bpmn:timerEventDefinition>
    </bpmn:boundaryEvent>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_08pgb2n">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="209" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Event_194crw3_di" bpmnElement="Event_194crw3">
        <dc:Bounds x="432" y="209" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_1gd4dih_di" bpmnElement="Activity_1ss4p82">
        <dc:Bounds x="270" y="187" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Event_1pm68c1_di" bpmnElement="Event_0ls5cw8">
        <dc:Bounds x="302" y="82" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Event_1tbuyeb_di" bpmnElement="Event_1loqmtz">
        <dc:Bounds x="302" y="169" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_069if4q_di" bpmnElement="Flow_069if4q">
        <di:waypoint x="215" y="227" />
        <di:waypoint x="270" y="227" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_1mfgi96_di" bpmnElement="Flow_1mfgi96">
        <di:waypoint x="370" y="227" />
        <di:waypoint x="432" y="227" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_1tcwbyq_di" bpmnElement="Flow_1tcwbyq">
        <di:waypoint x="320" y="169" />
        <di:waypoint x="320" y="118" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
`;

export const getResourceDataDmn = () =>
  `
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd" xmlns:fluxnova="http://fluxnova.org/schema/1.0/dmn" xmlns:biodi="http://bpmn.io/schema/dmn/biodi/1.0" id="Definitions_19lrihq" name="DRD" namespace="http://fluxnova.org/schema/1.0/dmn" exporter="Fluxnova Modeler" exporterVersion="3.2.3">
  <decision id="Auto-Approval" name="Automated Approval">
    <extensionElements>
      <biodi:bounds x="150" y="150" width="180" height="80" />
      <biodi:edge source="belowThreshold">
        <biodi:waypoints x="166" y="339" />
        <biodi:waypoints x="218" y="230" />
      </biodi:edge>
      <biodi:edge source="eligibleRegistration">
        <biodi:waypoints x="360" y="344" />
        <biodi:waypoints x="284" y="230" />
      </biodi:edge>
    </extensionElements>
    <informationRequirement>
      <requiredDecision href="#belowThreshold" />
    </informationRequirement>
    <informationRequirement>
      <requiredDecision href="#eligibleRegistration" />
    </informationRequirement>
    <decisionTable id="decisionTable_1" hitPolicy="FIRST">
      <input id="input_1" label="belowThreshold" fluxnova:inputVariable="belowThreshold">
        <inputExpression id="inputExpression_1" typeRef="boolean">
          <text></text>
        </inputExpression>
      </input>
      <input id="InputClause_1q3hgxb" label="eligibleRegistration" fluxnova:inputVariable="eligibleRegistration">
        <inputExpression id="LiteralExpression_0xlx0jd" typeRef="boolean">
          <text></text>
        </inputExpression>
      </input>
      <output id="output_1" label="autoApproval" name="autoApproval" typeRef="boolean" />
      <rule id="DecisionRule_1czxqmr">
        <inputEntry id="UnaryTests_1icjbeh">
          <text>false</text>
        </inputEntry>
        <inputEntry id="UnaryTests_1r0jtdq">
          <text></text>
        </inputEntry>
        <outputEntry id="LiteralExpression_14v1jaf">
          <text>false</text>
        </outputEntry>
      </rule>
      <rule id="DecisionRule_1w2st6g">
        <inputEntry id="UnaryTests_0zb89u5">
          <text></text>
        </inputEntry>
        <inputEntry id="UnaryTests_0tbpsa5">
          <text>false</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_0mtxvv8">
          <text>false</text>
        </outputEntry>
      </rule>
      <rule id="DecisionRule_08xv5p5">
        <inputEntry id="UnaryTests_1k73rke">
          <text>true</text>
        </inputEntry>
        <inputEntry id="UnaryTests_1o4d3at">
          <text>true</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_18jx83x">
          <text>true</text>
        </outputEntry>
      </rule>
      <rule id="DecisionRule_1qf3w4e">
        <inputEntry id="UnaryTests_1jar0q9">
          <text></text>
        </inputEntry>
        <inputEntry id="UnaryTests_17sfsxd">
          <text></text>
        </inputEntry>
        <outputEntry id="LiteralExpression_0iivnl2">
          <text>false</text>
        </outputEntry>
      </rule>
      <rule id="DecisionRule_11x32aw">
        <inputEntry id="UnaryTests_00zi7e3">
          <text></text>
        </inputEntry>
        <inputEntry id="UnaryTests_1moga6h">
          <text></text>
        </inputEntry>
        <outputEntry id="LiteralExpression_09ahs4g">
          <text></text>
        </outputEntry>
      </rule>
    </decisionTable>
  </decision>
  <decision id="belowThreshold" name="Below Threshold">
    <extensionElements>
      <biodi:bounds x="57" y="339" width="180" height="80" />
    </extensionElements>
    <decisionTable id="DecisionTable_08wxx0g">
      <input id="InputClause_0shb89u" label="transferAmountInteger" fluxnova:inputVariable="transferAmountInteger">
        <inputExpression id="LiteralExpression_1pbmee1" typeRef="integer">
          <text></text>
        </inputExpression>
      </input>
      <output id="OutputClause_18eqvrl" label="belowThreshold" name="belowThreshold" typeRef="boolean" />
      <rule id="DecisionRule_0pp2dnx">
        <inputEntry id="UnaryTests_0szbbtl">
          <text>&gt; 10000</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_0bt2mgi">
          <text>false</text>
        </outputEntry>
      </rule>
      <rule id="DecisionRule_1gisf7g">
        <inputEntry id="UnaryTests_1h6voip">
          <text>&lt;= 10000</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_0e0p4ca">
          <text>true</text>
        </outputEntry>
      </rule>
    </decisionTable>
  </decision>
  <decision id="eligibleRegistration" name="Eligible Registration">
    <extensionElements>
      <biodi:bounds x="296" y="344" width="180" height="80" />
    </extensionElements>
    <decisionTable id="DecisionTable_1smgb39">
      <input id="InputClause_1af2dga" label="accountRegistration" fluxnova:inputVariable="accountRegistration">
        <inputExpression id="LiteralExpression_1a7lc2e" typeRef="string" />
      </input>
      <output id="OutputClause_02s8sgu" label="eligibleRegistration" name="eligibleRegistration" typeRef="boolean" />
      <rule id="DecisionRule_1ma5zvu">
        <inputEntry id="UnaryTests_04ttuwi">
          <text>"Individual"</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_1v7vg17">
          <text>true</text>
        </outputEntry>
      </rule>
      <rule id="DecisionRule_1y912r4">
        <inputEntry id="UnaryTests_0ctq7g2">
          <text>"Trust"</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_099g8jk">
          <text>false</text>
        </outputEntry>
      </rule>
    </decisionTable>
  </decision>
</definitions>`.trim();
