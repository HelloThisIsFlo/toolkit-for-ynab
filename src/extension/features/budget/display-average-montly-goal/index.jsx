import React from 'react';
import { Feature } from 'toolkit/extension/features/feature';
import { getEmberView } from 'toolkit/extension/utils/ember';
import { componentBefore } from 'toolkit/extension/utils/react';

import { InspectorCard } from './InspectorCard';
import { FormattedCurrency } from './FormattedCurrency';
import { HARDCODED_TOTAL_INCOME } from './hardcodedTotalIncome';

const BreakdownItem = ({ label, children, className = '' }) => {
  return (
    <div className={className}>
      <div>{label}</div>
      <div>{children}</div>
    </div>
  );
};

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
        throw new Error(`Invalid goal frequency id: '${goalFrequencyId}'`);
    }
  }

  computeAverageMonthlyGoalForCategory(category) {
    const computeAvgMonthlyGoal = () => {
      const computeForNonRepeatingTarget = () => {
        const goalIsNotActive =
          category.budgetMonth.isBefore(category.goalStartedOnDate) ||
          category.budgetMonth.isAfter(category.goalTargetDate);

        if (goalIsNotActive) return 0;

        const totalDurationMonths =
          category.goalTargetDate.monthsApart(category.goalStartedOnDate) + 1;
        return category.goalTargetAmount / totalDurationMonths;
      };

      switch (category.goalType) {
        case 'MF':
          return category.goalTarget;
        case 'NEED':
          if (category.goalFrequency === 0) {
            return computeForNonRepeatingTarget();
          }
          return category.goalTargetAmount * this.goalNfsMultiplier(category.goalFrequency);
        case 'TBD':
          return computeForNonRepeatingTarget();
        case 'TB':
        case null:
          return 0;
        default:
          throw new Error(`Invalid goal type: '${category.goalType}'`);
      }
    };

    return {
      avgMonthlyGoal: computeAvgMonthlyGoal(),
      isChecked: category.get('isChecked'),
    };
  }

  computeAverageMonthlyGoals() {
    const sumAvgMonthlyGoals = (catArr) => catArr.reduce((acc, cat) => acc + cat.avgMonthlyGoal, 0);
    let categories = [];

    $('.budget-table-row.is-sub-category').each((_, element) => {
      const category = getEmberView(element.id, 'category');
      const { avgMonthlyGoal, isChecked } = this.computeAverageMonthlyGoalForCategory(category);
      categories.push({ avgMonthlyGoal, isChecked });
    });

    const checkedCategories = categories.filter((cat) => cat.isChecked);
    const noCheckedCategories = checkedCategories.length === 0;

    return noCheckedCategories
      ? sumAvgMonthlyGoals(categories)
      : sumAvgMonthlyGoals(checkedCategories);
  }

  computerBufferValueForCategory(category) {
    return {
      bufferValue: category.goalType === 'TB' ? category.goalTargetAmount : 0,
      isChecked: category.get('isChecked'),
    };
  }

  computeTotalBuffers() {
    // Same as computeAvergeMonthlyGoal => Refactor
    const sumBufferValues = (catArr) => catArr.reduce((acc, cat) => acc + cat.bufferValue, 0);
    let categories = [];

    $('.budget-table-row.is-sub-category').each((_, element) => {
      const category = getEmberView(element.id, 'category');
      const { bufferValue, isChecked } = this.computerBufferValueForCategory(category);
      categories.push({ bufferValue, isChecked });
    });

    const checkedCategories = categories.filter((cat) => cat.isChecked);
    const noCheckedCategories = checkedCategories.length === 0;

    return noCheckedCategories ? sumBufferValues(categories) : sumBufferValues(checkedCategories);
  }

  addAverageMonthlyGoals(element) {
    const averageMonthlyGoals = this.computeAverageMonthlyGoals();
    const totalBuffers = this.computeTotalBuffers();
    const totalIncome = HARDCODED_TOTAL_INCOME;

    $('.' + this.containerClass).remove();

    const target = $('.card.budget-breakdown-monthly-totals', element);
    if (!target.length) {
      return;
    }

    componentBefore(
      this.createInspectorElement(averageMonthlyGoals, totalBuffers, totalIncome),
      target
    );
  }

  createInspectorElement(averageMonthlyGoals, totalBuffers, totalIncome) {
    const slack = totalIncome - averageMonthlyGoals - totalBuffers;
    return (
      <div className={this.containerClass}>
        <InspectorCard
          title="Average Monthly Slack"
          mainAmount={slack}
          className="average-monthly-goals-card"
        >
          <div className="ynab-breakdown">
            <BreakdownItem label="Total Income" className="colorize-currency">
              <FormattedCurrency amount={totalIncome} />
            </BreakdownItem>
            <BreakdownItem label="Average Monthly Goals" className="colorize-currency">
              <FormattedCurrency amount={-averageMonthlyGoals} />
            </BreakdownItem>
            <BreakdownItem label="Total Buffers" className="extra-bottom-space colorize-currency">
              <FormattedCurrency amount={-totalBuffers} />
            </BreakdownItem>

            <BreakdownItem label="Average Monthly Slack" className="colorize-currency">
              <FormattedCurrency amount={slack} />
            </BreakdownItem>
          </div>
        </InspectorCard>
      </div>
    );
  }

  invoke() {
    this.addToolkitEmberHook('budget/budget-inspector', 'didRender', this.addAverageMonthlyGoals);
  }
}
