/// <reference path="../typings/tsd.d.ts" />

// model
import { Tab } from "./tab"
import { Widget } from "./widget"
import { WidgetInstance } from "./widget_instance"
import { SerializedWorkspace } from "../model/serialized_workspace";

// super
import { frontend } from "../super/frontend"

var className: string = "";

interface genericList {
  object: string;
  list: Array<any>;
}
interface genericCounter {
  object: string;
  counter: number;
}
function genericFilter(list: genericList | genericCounter, index: number, array: Array<any>): boolean {
  return (list.object == className);
}

export class Workspace {

  public id: number;
  public name: string;
  public created: Date;
  public modified: Date;

  private Lists: { object: string, list: Array<any> }[];
  private Counters: { object: string, counter: number }[];

  constructor() {
    this._clearLists();
    this._clearCounters();
  }

  public initWorkspace() {
    this._initWorkspace();
  }
  private _initWorkspace() {
    new Widget("Topic Viewer", "TopicViewer", "./widgets/topic_viewer");
    new Widget("Param Viewer", "ParamViewer", "./widgets/param_viewer");
    new Widget("Service Viewer", "ServiceViewer", "./widgets/service_viewer");
    new Widget("Google Maps GPS Viewer", "GoogleMapsGpsViewer", "./widgets/gmaps_gps");
    new Widget("Camera Viewer", "CameraViewer", "./widgets/camera_viewer");
    new Widget("Laser Scan Viewer", "LaserScanViewer", "./widgets/laser_scan_viewer");
  }

  private _clearWorkspace() {
    this._clearLists();
    this._clearCounters();
    this._initWorkspace();
  }
  private _clearLists() {
    this.Lists = new Array<genericList>(
      { object: "Tab", list: new Array<Tab>() },
      { object: "Widget", list: new Array<Widget>() },
      { object: "WidgetInstance", list: new Array<WidgetInstance>() }
    );
  }
  private _clearCounters() {
    this.Counters = new Array<genericCounter>(
      { object: "Tab", counter: 0 },
      { object: "Widget", counter: 0 },
      { object: "WidgetInstance", counter: 0 }
    );
  }

  public loadWorkspace(workspace: SerializedWorkspace): void {
    let data: {Lists: genericList[], Counters: genericCounter[]} = JSON.parse(workspace.data);
    
    console.log(data);

    this._clearWorkspace();

    data.Lists.forEach((glist: genericList, i: number) => {
      if(glist.object == "Tab") {
        glist.list.forEach((tab: Tab, j: number) => {
          new Tab(tab.name);
        });
      }
    });

    data.Lists.forEach((glist: genericList, i: number) => {
      if(glist.object == "WidgetInstance") {
        glist.list.forEach((widgetInstance: WidgetInstance, j: number) => {
          let widget: Widget = this.get<Widget>(widgetInstance.widget_id, "Widget");
          let tab: Tab = this.get<Tab>(widgetInstance.tab_id, "Tab");
          new WidgetInstance(widget, tab);
        });
      }
    });

    this.Counters = data.Counters;
  }
  public extractData(): string {
    let data: any = { Lists: this.Lists, Counters: this.Counters };
    console.log(data);
    let dataString: string = JSON.stringify(data);
    return dataString;
  }

  private getCounter<T>(): genericCounter {
    let counter = this.Counters.filter(genericFilter);
    if (counter.length != 1) {
      throw new Error("Workspace list searching error");
    }
    return counter[0];
  }
  public getList<T>(aClassName?: string): any[] {
    if(aClassName != undefined) className = aClassName;

    let list = this.Lists.filter(genericFilter);

    if (list.length != 1) {
      throw new Error("Workspace list searching error");
    }

    return list[0].list;
  }
  public create<T extends { id: number }>(object: T): void {
    let aClassName: string = object.constructor["name"];
    className = aClassName;

    let counter: genericCounter = this.getCounter<T>();
    let list: any[] = this.getList<T>();

    object.id = ++counter.counter;
    list.push(object);
  }

  public get<T extends { id: number }>(id: number, aClassName: string): T {
    className = aClassName;
    let list = this.Lists.filter(genericFilter)[0].list;

    function getFilter(element: T, index: number, array: Array<T>): boolean {
      return element.id == id;
    };
    let filteredList: any[] = list.filter(getFilter);

    if (filteredList.length != 1) {
      console.log(list);
      throw new Error("No unique " + aClassName + " found with id equals to " + id + " on the list above");
    }

    return filteredList[0];
  }
  public getCurrentTab(): Tab {
    className = "Tab";
    let list = this.Lists.filter(genericFilter)[0].list;
    let tab: Tab;

    function activeTabFilter(tab: Tab, index: number, array: Array<Tab>): boolean {
      return tab.active;
    }

    if (list.length == 0) {
      (new Tab("Tab #" + (list.length + 1))).setActive();
    }

    return list.filter(activeTabFilter)[0];
  }

  public remove<T extends { id: number }>(id: number, aClassName: string) {
    className = aClassName;
    let list = this.Lists.filter(genericFilter)[0].list;

    function removeFilter(obj: { id: number }, index: number, array: Array<T>): boolean {
      return obj.id != id;
    };
    let filteredList: any[] = list.filter(removeFilter);

    if (filteredList.length != (list.length - 1)) {
      throw new Error("No unique " + aClassName + " found with id equals to " + id + " on the list above");
    }
  }

}

export var currentWorkspace: Workspace = new Workspace();
