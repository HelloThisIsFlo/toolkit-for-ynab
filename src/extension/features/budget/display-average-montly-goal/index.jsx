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

  // They changed
  // goalCadence =>
  // - 1 for month
  // - 2 for week
  // - 13 for year
  // - Other values deprecated => Make sure by removing from 'switch'
  //
  // goalCadenceFrequency =>
  // - number of 'goalCadence' (eg, 3 for every 3 months)
  //
  //
  //
  //
  goalNfsMultiplier(goalCadence, goalCadenceFrequency) {
    const computeCadence = () => {
      /* Here is a list of all the value for 'goalCadence' that have been deprecated:
        (Just keeping in case I mis-understood or if they rollback their update)
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
      case 14:
        // 2 Years
        return 1 / 24;
    */

      switch (goalCadence) {
        case 1:
          return 'month';
        case 2:
          return 'week';
        case 13:
          return 'year';
        default:
          throw new Error(`Invalid goal cadence: '${goalCadence}'`);
      }
    };

    switch (computeCadence()) {
      case 'week':
        return 52 / (12 * goalCadenceFrequency);

      case 'month':
        return 12 / (12 * goalCadenceFrequency);

      case 'year':
        return 1 / (12 * goalCadenceFrequency);

      default:
        throw new Error(`Invalid cadence: '${computeCadence()}'`);
    }
  }

  notFundedMonthly(category) {
    return category.masterCategory.name.includes('🔽');
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

      if (this.notFundedMonthly(category)) {
        console.log(
          `Ignoring category because not funded monthly '🔽' | '${category.displayName}'`
        );
        return 0;
      }

      switch (category.goalType) {
        case 'MF':
          return category.goalTarget;
        case 'NEED':
          if (category.goalCadence === 0) {
            return computeForNonRepeatingTarget();
          }
          return (
            category.goalTargetAmount *
            this.goalNfsMultiplier(category.goalCadence, category.goalCadenceFrequency)
          );
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
      const category = getEmberView(element.id).category;
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
    const computeValue = () => {
      const isNotBuffer = category.goalType !== 'TB';
      if (isNotBuffer || this.notFundedMonthly(category)) return 0;

      return category.goalTargetAmount;
    };

    return {
      bufferValue: computeValue(),
      isChecked: category.get('isChecked'),
    };
  }

  computeTotalBuffers() {
    // Same as computeAvergeMonthlyGoal => Refactor
    const sumBufferValues = (catArr) => catArr.reduce((acc, cat) => acc + cat.bufferValue, 0);
    let categories = [];

    $('.budget-table-row.is-sub-category').each((_, element) => {
      const category = getEmberView(element.id).category;
      const { bufferValue, isChecked } = this.computerBufferValueForCategory(category);
      console.log({
        cat: category,
        name: category.displayName,
        goalCadence: category.goalCadence,
        goalCadenceFrequency: category.goalCadenceFrequency,
      });
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
      target[0]
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
    return null;
  }

  observe(changedNodes) {
    if (!this.shouldInvoke()) {
      return;
    }

    if (changedNodes.has('budget-inspector-button')) {
      this.addAverageMonthlyGoals();
    }
  }
}
