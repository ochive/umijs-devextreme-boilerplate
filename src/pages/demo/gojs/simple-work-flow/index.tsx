// App.js
import * as go from 'gojs';
import { ReactDiagram, ReactPalette } from 'gojs-react';
import React from 'react';
import './index.less'; // 必须包含 .diagram-component 的样式
import { diagramNodeTemplate, linkSelectionAdornmentTemplate, nodeResizeAdornmentTemplate, nodeRotateAdornmentTemplate, nodeSelectionAdornmentTemplate } from './templates';
import Form, { ButtonItem, EmptyItem, SimpleItem } from 'devextreme-react/form';
import { produce } from 'immer';



class TopRotatingTool extends go.RotatingTool {
    /** @override */
    updateAdornments(part: go.Part) {
        go.RotatingTool.prototype.updateAdornments.call(this, part);
        var adornment = part.findAdornment("Rotating");
        if (adornment !== null) {
            adornment.location = part.rotateObject.getDocumentPoint(new go.Spot(0.5, 0, 0, -30));  // above middle top
        }
    }

    /** @override */
    rotate(newangle: number) {
        go.RotatingTool.prototype.rotate.call(this, newangle + 90);
    }
}

/**
 * 这个函数处理对GoJS model所做的任何改动.
 * 可以在这里更新React state
 */
function handleModelChange(changes: any) {
    console.log('changes', changes)
    // alert('GoJS model changed!');
}


// interface DiagramProps {
//     nodeDataArray: Array<go.ObjectData>;
//     linkDataArray: Array<go.ObjectData>;
//     modelData: go.ObjectData;
//     skipsDiagramUpdate: boolean;
//     onDiagramEvent: (e: go.DiagramEvent) => void;
//     onModelChange: (e: go.IncrementalData) => void;
// }

/**
 * gojs流程图.非受控版.
 */
class App extends React.Component<any, any>{
    private diagramRef: React.RefObject<ReactDiagram>;

    constructor(props: any) {
        super(props);

        this.state = {
            paletteNodeDataArray: [  // 指定画板的内容.
                { key: 0, text: "开始", size: '104 40', figure: "RoundedRectangle", fill: "#00AD5F" },
                { key: 1, text: "流程", size: '104 64' },
                // { text: "数据库", figure: "Database", fill: "lightgray" },
                { key: 2, text: "判定", figure: "Diamond", fill: "lightskyblue" },
                { key: 3, text: "结束", size: '104 40', figure: "RoundedRectangle", fill: "#CE0620" },
                { key: 4, text: "文档", figure: "RoundedRectangle", fill: "lightyellow" }
            ],
            paletteLinkDataArray: [ // 给画板加一个独立的链接,可以让用户拖放.
                { points: new go.List<go.Point>().addAll([new go.Point(0, 0), new go.Point(30, 0), new go.Point(30, 40), new go.Point(60, 40)]) }
            ],
            savedModel: '', // diagram的model对象的json字符串
            nodeDataArray: [], // diagram的node数据
            linkDataArray: [], // diagram的连接线数据
            modelData: {
                canRelink: true
            },
            selectedData: null,
            skipsDiagramUpdate: false
        }

        this.diagramRef = React.createRef();
    }

    componentDidMount() {
        // if (!this.diagramRef.current) return;
        // const diagram = this.diagramRef.current.getDiagram();
        // if (diagram instanceof go.Diagram) {
        //     diagram.addDiagramListener('ChangedSelection', this.props.onDiagramEvent);
        // }
    }

    componentWillUnmount() {
        // if (!this.diagramRef.current) return;
        // const diagram = this.diagramRef.current.getDiagram();
        // if (diagram instanceof go.Diagram) {
        //     diagram.removeDiagramListener('ChangedSelection', this.props.onDiagramEvent);
        // }
    }

    render() {

        const { paletteNodeDataArray,
            paletteLinkDataArray,
            savedModel,
        } = this.state

        return (
            <>
                <div className={'side-layout'}>
                    <ReactDiagram
                        ref={this.diagramRef}
                        initDiagram={this.initDiagram}
                        divClassName='diagram-component'
                        nodeDataArray={[
                        ]}
                        // linkDataArray={[
                        //     { key: -1, from: 0, to: 1 },
                        //     { key: -2, from: 0, to: 2 },
                        //     { key: -3, from: 1, to: 1 },
                        //     { key: -4, from: 2, to: 3 },
                        //     { key: -5, from: 3, to: 0 }
                        // ]}
                        onModelChange={handleModelChange}
                        skipsDiagramUpdate={false}
                    />
                    <ReactPalette
                        initPalette={this.initPalette}
                        divClassName={'palette-component'}
                        nodeDataArray={paletteNodeDataArray}
                    // linkDataArray={paletteLinkDataArray}
                    />
                </div>
                <section>
                    <Form
                        // ref={this.formRef} 
                        colCount={2}
                        labelLocation={'left'}
                        formData={{ savedModel }}
                    >
                        <ButtonItem
                            horizontalAlignment={'left'}
                            buttonOptions={{
                                type: 'default',
                                text: 'save',
                                onClick: this.save,
                            }}
                        />
                        <ButtonItem
                            horizontalAlignment={'right'}
                            buttonOptions={{
                                type: 'normal',
                                text: 'load',
                                onClick: this.load,
                            }}
                        />
                        <SimpleItem
                            colSpan={2}
                            label={{ text: '流程图模型数据' }}
                            dataField={'savedModel'}
                            editorType={'dxTextArea'}
                            editorOptions={{
                                height: 104,
                                onValueChanged: (e: any) => {
                                    return { savedModel: e.value };
                                },
                            }}
                        />
                    </Form>
                </section>
            </>
        );
    }

    /**
     * diagram的初始化方法,传给ReactDiagram组件.
     * 此方法负责创建diagram、初始化model和模板。
     * model的数据不要再这设置，ReactDiagram使用一些props来接收和处理model。
     */
    initDiagram = () => {
        const objGo = go.GraphObject.make;
        // set your license key here before creating the diagram: go.Diagram.licenseKey = "...";
        const diagram =
            objGo(go.Diagram,
                {
                    'grid.visible': true, //画布上面是否出现网格
                    'allowZoom': false, // 是否允许缩放
                    'commandHandler.deletesTree': true, // 允许使用delete键删除节点.默认true
                    'undoManager.isEnabled': true,  // 允许撤销和重做.
                    // 'undoManager.maxHistoryLength': 0,  // 设置为0时相当于禁用撤销/重做功能.
                    // 'clickCreatingTool.archetypeNodeData': { text: 'new node', color: 'lightblue' }, // 允许在画布上面双击的时候创建节点
                    model: objGo(go.GraphLinksModel,
                        {
                            linkKeyProperty: 'key'  // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
                        }),
                    grid: objGo(go.Panel, "Grid",
                        objGo(go.Shape, "LineH", { stroke: "lightgray", strokeWidth: 0.5 }),
                        objGo(go.Shape, "LineH", { stroke: "gray", strokeWidth: 0.5, interval: 10 }),
                        objGo(go.Shape, "LineV", { stroke: "lightgray", strokeWidth: 0.5 }),
                        objGo(go.Shape, "LineV", { stroke: "gray", strokeWidth: 0.5, interval: 10 })
                    ),
                    allowDrop: true,  // 想要接收画板拖放的元素,必须设置为true
                    "draggingTool.dragsLink": true,
                    "draggingTool.isGridSnapEnabled": true,
                    "linkingTool.isUnconnectedLinkValid": true,
                    "linkingTool.portGravity": 20,
                    "relinkingTool.isUnconnectedLinkValid": true,
                    "relinkingTool.portGravity": 20,
                    "relinkingTool.fromHandleArchetype":
                        objGo(go.Shape, "Diamond", { segmentIndex: 0, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "tomato", stroke: "darkred" }),
                    "relinkingTool.toHandleArchetype":
                        objGo(go.Shape, "Diamond", { segmentIndex: -1, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "darkred", stroke: "tomato" }),
                    "linkReshapingTool.handleArchetype":
                        objGo(go.Shape, "Diamond", { desiredSize: new go.Size(7, 7), fill: "lightblue", stroke: "deepskyblue" }),
                    rotatingTool: objGo(TopRotatingTool),
                    "rotatingTool.snapAngleMultiple": 15,
                    "rotatingTool.snapAngleEpsilon": 15,
                });

        diagram.nodeTemplate = diagramNodeTemplate

        diagram.linkTemplate =
            objGo(go.Link,  // the whole link panel
                { selectable: true, selectionAdornmentTemplate: linkSelectionAdornmentTemplate },
                { relinkableFrom: true, relinkableTo: true, reshapable: true },
                {
                    routing: go.Link.AvoidsNodes,
                    curve: go.Link.JumpOver,
                    corner: 5,
                    toShortLength: 4
                },
                new go.Binding("points").makeTwoWay(),
                objGo(go.Shape,  // the link path shape
                    { isPanelMain: true, strokeWidth: 2 }),
                objGo(go.Shape,  // the arrowhead
                    { toArrow: "Standard", stroke: null }),
                objGo(go.Panel, "Auto",
                    new go.Binding("visible", "isSelected").ofObject(),
                    objGo(go.Shape, "RoundedRectangle",  // the link shape
                        { fill: "#F8F8F8", stroke: null }),
                    objGo(go.TextBlock,
                        {
                            textAlign: "center",
                            font: "10pt helvetica, arial, sans-serif",
                            stroke: "#919191",
                            margin: 2,
                            minSize: new go.Size(10, NaN),
                            editable: true
                        },
                        new go.Binding("text").makeTwoWay())
                )
            );

        // load();  // load an initial diagram from some JSON text

        return diagram;
    }

    initPalette = () => {
        const objGo = go.GraphObject.make;
        const palette = objGo(go.Palette,
            {
                maxSelectionCount: 1,
                nodeTemplate: diagramNodeTemplate, // share the templates used by myDiagram
                // nodeTemplateMap: this.initDiagram().nodeTemplateMap,  // share the templates used by myDiagram
                linkTemplate: // simplify the link template, just in this Palette
                    objGo(go.Link,
                        { // because the GridLayout.alignment is Location and the nodes have locationSpot == Spot.Center,
                            // to line up the Link in the same manner we have to pretend the Link has the same location spot
                            locationSpot: go.Spot.Center,
                            selectionAdornmentTemplate:
                                objGo(go.Adornment, "Link",
                                    { locationSpot: go.Spot.Center },
                                    objGo(go.Shape,
                                        { isPanelMain: true, fill: null, stroke: "deepskyblue", strokeWidth: 0 }),
                                    objGo(go.Shape,  // the arrowhead
                                        { toArrow: "Standard", stroke: null })
                                )
                        },
                        {
                            routing: go.Link.AvoidsNodes,
                            curve: go.Link.JumpOver,
                            corner: 5,
                            toShortLength: 4
                        },
                        new go.Binding("points"),
                        objGo(go.Shape,  // the link path shape
                            { isPanelMain: true, strokeWidth: 2 }),
                        objGo(go.Shape,  // the arrowhead
                            { toArrow: "Standard", stroke: null })
                    ),
                // model: new go.GraphLinksModel([  // specify the contents of the Palette
                //     { text: "开始", figure: "Circle", fill: "#00AD5F" },
                //     { text: "流程" },
                //     // { text: "数据库", figure: "Database", fill: "lightgray" },
                //     { text: "判定", figure: "Diamond", fill: "lightskyblue" },
                //     { text: "结束", figure: "Circle", fill: "#CE0620" },
                //     { text: "文档", figure: "RoundedRectangle", fill: "lightyellow" }
                // ],
                //     [
                //         // the Palette also has a disconnected Link, which the user can drag-and-drop
                //         { points: new go.List(go.Point).addAll([new go.Point(0, 0), new go.Point(30, 0), new go.Point(30, 40), new go.Point(60, 40)]) }
                //     ])
            });

        return palette;
    }

    /**
     * Handle changes to the checkbox on whether to allow relinking.
     * @param e a change event from the checkbox
     */
    // public handleRelinkChange(e: any) {
    //     const target = e.target;
    //     const value = target.checked;
    //     this.setState({ modelData: { canRelink: value }, skipsDiagramUpdate: false });
    // }

    /**
     * 将diagram的模型数据以JS字面量对象方式保存.
     */
    save = () => {
        this.saveDiagramProperties()  // do this first, before writing to JSON
        this.setState({ savedModel: this.diagram.model.toJson() })
        this.diagram.isModified = false
    }

    /**
     * 从JS字面量对象中读取diagram的模型数据.
     */
    load = () => {
        this.diagram.model = go.Model.fromJson(this.state.savedModel);
        this.loadDiagramProperties();  // do this after the Model.modelData has been brought into memory
    }

    saveDiagramProperties = () => {
        this.diagram.model.modelData.position = go.Point.stringify(this.diagram.position);
    }
    loadDiagramProperties = () => {
        // set Diagram.initialPosition, not Diagram.position, to handle initialization side-effects
        var pos = this.diagram.model.modelData.position;
        if (pos) {
            this.diagram.initialPosition = go.Point.parse(pos);
        }
    }

    get diagram(): go.Diagram {
        return this.diagramRef.current?.getDiagram()!
    }
}

export default App