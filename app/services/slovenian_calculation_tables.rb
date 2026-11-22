class SlovenianCalculationTables
  INCOME_2026 = [241.49, 402.50, 483.01, 563.50, 711.12, 858.67, 1100.20, 1328.28].freeze
  CHILD_2026 = [
    [147.69, 162.45, 177.24], [126.26, 139.58, 152.82], [96.24, 107.56, 118.85], [75.91, 86.61, 97.51],
    [62.06, 72.42, 82.72], [39.32, 49.21, 59.05], [29.52, 39.32, 49.21], [25.70, 35.53, 45.35]
  ].freeze
  SECONDARY_2026 = CHILD_2026.first(6).concat([[37.25, 47.07, 64.14], [29.57, 39.41, 51.53]]).freeze
  KINDERGARTEN_2026 = [0, 10, 20, 30, 35, 43, 53, 66, 77].freeze
  MINIMUM_WAGE_2026 = 1481.88
  # First month, last month, base rate, maximum as a share of minimum wage.
  UNEMPLOYMENT_2026 = [[1, 3, 80, 130], [4, 6, 60, 110], [7, 9, 60, 100], [10, 12, 60, 90], [13, 25, 50, 80]].freeze
  SALARY_2026 = {
    min: 1521.62,
    health_flat: 39.36,
    allowance: 462.66,
    contribution_rates: [15.50, 6.36, 0.10, 1.00, 0.14],
    # From (exclusive except first bracket), base tax, marginal rate.
    tax: [[0, 0, 16], [810.12, 129.62, 26], [2382.70, 538.49, 33], [4765.41, 1324.78, 39], [6862.19, 2142.53, 50]]
  }.freeze
  VAT_RATES = [22, 9.5, 5].freeze
  ANNUAL_TAX_2026 = {
    allowance: 5551.93,
    extra_limit: 17766.18,
    extra_intercept: 20832.39,
    extra_factor: 1.17259,
    tax: [[0, 0, 16], [9721.43, 1555.43, 26], [28592.44, 6461.89, 33], [57184.88, 15897.40, 39], [82346.23, 25710.33, 50]]
  }.freeze
  TAX_INDEX_2027 = 1.06225

  def self.projected_annual_tax_2027
    index = ->(amount) { (amount * TAX_INDEX_2027).round(2) }
    lower = 0
    preceding_rate = 0
    fixed = 0
    tax = ANNUAL_TAX_2026.fetch(:tax).map do |threshold, _, rate|
      limit = index.call(threshold)
      fixed = (fixed + (limit - lower) * preceding_rate / 100).round(2)
      lower = limit
      preceding_rate = rate
      [limit, fixed, rate]
    end
    ANNUAL_TAX_2026.merge(
      allowance: index.call(ANNUAL_TAX_2026.fetch(:allowance)),
      extra_limit: index.call(ANNUAL_TAX_2026.fetch(:extra_limit)),
      extra_intercept: index.call(ANNUAL_TAX_2026.fetch(:extra_intercept)),
      tax: tax
    )
  end

  def self.data(kind)
    case kind
    when :child then { limits: INCOME_2026, amounts: CHILD_2026, secondary: SECONDARY_2026 }
    when :kindergarten then { limits: INCOME_2026, rates: KINDERGARTEN_2026 }
    when :unemployment then { minimum: MINIMUM_WAGE_2026, minimum_rate: 70, periods: UNEMPLOYMENT_2026 }
    when :salary then SALARY_2026
    when :annual_tax then { '2026' => ANNUAL_TAX_2026, '2027' => projected_annual_tax_2027 }
    when :vat then { rates: VAT_RATES }
    else {}
    end
  end
end
