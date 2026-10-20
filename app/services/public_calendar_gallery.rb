class PublicCalendarGallery
  CATALOG = Rails.root.join('site/free/catalog.json')

  def self.available? = CATALOG.file?

  def self.rows_for(year:, month: nil)
    raise ArgumentError, 'Nepodprto leto.' unless (2027..2030).cover?(year)
    raise ArgumentError, 'Neveljaven mesec.' if month && !(1..12).cover?(month)
    rows = index.fetch([month ? 'monthly' : 'annual', year, month])
    ids = PrintCatalog.designs.map { |design| design.fetch('id') }
    raise 'Koledarska zbirka mora vsebovati vseh 15 predlog.' unless rows.size == 15 && rows.map { |row| row.dig('options', 'design') }.sort == ids.sort
    PrintCatalog.designs.map do |design|
      rows.find { |row| row.dig('options', 'design') == design.fetch('id') }.merge('design' => design)
    end
  end

  def self.public_file(path)
    return unless available? && public_paths.include?(path)
    file = Rails.root.join('site', path.delete_prefix('/'))
    file if file.file?
  end

  def self.public_paths
    @public_paths ||= index.values.flatten.flat_map { |row| row.fetch('files').values }.to_set
  end

  def self.index
    @index ||= JSON.parse(CATALOG.read).select do |row|
      options = row.fetch('options')
      %w[annual monthly].include?(options['type']) && options['paper'] == 'A4' && options['orientation'] == 'portrait' && options['name'].blank? && options['notes'].blank? && options['entries'].blank?
    end.group_by do |row|
      options = row.fetch('options')
      [options['type'], options['year'], options['type'] == 'monthly' ? options['month'] : nil]
    end
  end
  private_class_method :index, :public_paths
end
