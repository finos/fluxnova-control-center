//generic test class
import { Subscription } from 'rxjs';

export class SubSink {
  subscriptions: Subscription[] = [];
  add(s: Subscription) {
    this.subscriptions.push(s);
  }
  unsubscribe() {
    this.subscriptions.forEach((s) => s?.unsubscribe());
    this.subscriptions = [];
  }
}
