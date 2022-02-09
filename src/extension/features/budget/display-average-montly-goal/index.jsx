import React from 'react';
import { Feature } from 'toolkit/extension/features/feature';
import { getEmberView } from 'toolkit/extension/utils/ember';
import { componentBefore } from 'toolkit/extension/utils/react';

import { InspectorCard } from './InspectorCard';

export class DisplayAverageMonthlyGoals extends Feature {
  containerClass = 'tk-average-monthly-goals';

  // get configuration() {
  //   return this.settings.enabled || 'show-total-only';
  // }

  injectCSS() {
    return require('./index.css');
  }

  shouldInvoke() {
    return true;
  }

  destroy() {
    document.querySelector('.' + this.containerClass)?.remove();
  }

  goalNfsMultiplier(goalFrequencyId) {
    const avgNumbersOfSundays = 52 / 12;
    switch (goalFrequencyId) {
      case 1:
        // 1 Month
        return 1;
      case 2:
        // 1 Week
        return avgNumbersOfSundays;
      case 3:
        // 2 Months
        return 1 / 2;
      case 4:
        // 3 Months
        return 1 / 3;
      case 5:
        // 4 Months
        return 1 / 4;
      case 6:
        // 5 Months
        return 1 / 5;
      case 7:
        // 6 Months
        return 1 / 6;
      case 8:
        // 7 Months
        return 1 / 7;
      case 9:
        // 8 Months
        return 1 / 8;
      case 10:
        // 9 Months
        return 1 / 9;
      case 11:
        // 10 Months
        return 1 / 10;
      case 12:
        // 11 Months
        return 1 / 11;
      case 13:
        // 12 Months (1 Year)
        return 1 / 12;
      case 14:
        // 2 Years
        return 1 / 24;
      default:
        return 0;
    }
  }

  computeAverageMonthlyGoalForCategory(category) {
    const avgMonthlyGoal =
      category.goalType === 'MF'
        ? category.goalTarget
        : category.goalTargetAmount * this.goalNfsMultiplier(category.goalFrequency);

    return {
      avgMonthlyGoal,
      isChecked: category.get('isChecked'),
    };
  }

  computeAverageMonthlyGoals() {
    let averageMonthlyGoals = 0;

    $('.budget-table-row.is-sub-category').each((_, element) => {
      const category = getEmberView(element.id, 'category');
      const { avgMonthlyGoal, isChecked } = this.computeAverageMonthlyGoalForCategory(category);

      if (isChecked) {
        averageMonthlyGoals += avgMonthlyGoal;
      }
    });

    return averageMonthlyGoals;
  }

  addAverageMonthlyGoals(element) {
    const averageMonthlyGoals = this.computeAverageMonthlyGoals();

    $('.' + this.containerClass).remove();

    const target = $('.card.budget-breakdown-monthly-totals', element);
    if (!target.length) {
      return;
    }

    componentBefore(this.createInspectorElement(averageMonthlyGoals), target);
  }

  createInspectorElement(averageMonthlyGoals) {
    return (
      <div className={this.containerClass}>
        <InspectorCard
          title="Average Monthly Goals *POC*"
          mainAmount={averageMonthlyGoals}
          className="average-monthly-goals-card"
        ></InspectorCard>
      </div>
    );
  }

  invoke() {
    this.addToolkitEmberHook('budget/budget-inspector', 'didRender', this.addAverageMonthlyGoals);
  }
}
