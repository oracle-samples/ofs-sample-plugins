export interface ActivityItem {
  aid: number | null;
  position_in_route: number | any;
  astatus: string | undefined;
}
export class ActivityItemElement implements ActivityItem {
  aid: number | null;
  position_in_route: number | any;
  astatus: string | undefined;

  constructor(aid: number, position_in_route?: number, astatus?: string) {
    this.aid = aid;
    this.position_in_route = position_in_route;
    this.astatus = astatus;
  }
}

export class Activity {
  protected _data: ActivityItem[];

  data() {
    return this._data;
  }

  activities_by_status(status: string) {
    // Returns the provider pool inventory
    var data = this._data.filter((item) => item.astatus == status);
    return data;
  }

  find_next_activity() {
    console.debug(`looking for next activity in route`);
    var data = this._data;
    var started_activities: ActivityItem[] =
      this.activities_by_status("started");
    if (started_activities.length == 1) {
      return started_activities[0];
    } else {
      var pending_activities: ActivityItem[] =
        this.activities_by_status("pending");
      var ordered_pending_activities = pending_activities.filter(
        (item) => item.position_in_route > 0
      );
      ordered_pending_activities.sort((a, b) =>
        a.position_in_route < b.position_in_route
          ? -1
          : a.position_in_route > b.position_in_route
          ? 1
          : 0
      );
      if (ordered_pending_activities.length > 0) {
        return ordered_pending_activities[0];
      } else {
        return null;
      }
    }
  }

  constructor(activityData: any) {
    // Due to the structure we iterate through the keys of the object to get the array
    this._data = [];
    for (const property in activityData) {
      this._data = this._data.concat(activityData[property]);
    }
    // TODO: Check if installed inv is only for the current activity
  }
}
