import { Feature } from 'toolkit/extension/features/feature';
import { isYNABReady } from 'toolkit/extension/utils/ynab';

export class RewordPlanToBudget extends Feature {
  shouldInvoke() {
    return isYNABReady();
  }

  observe(changedNodes) {
    if (!this.shouldInvoke()) return;

    if (changedNodes.has('navlink-budget')) {
      this.invoke();
    }
  }

  invoke() {
    const button = document.querySelector('.navlink-budget .ember-view .navlink-label');
    if (button && button.textContent !== 'Budget') {
      button.textContent = 'Budget';
      button.setAttribute('title', 'Budget');
    }
  }
}
