require 'test_helper'

class PageMetadataTest < ActiveSupport::TestCase
  test 'ordinal dates do not end the first sentences of topic descriptions' do
    {
      '/prazniki/novo-leto/' => 'V Sloveniji sta 1. in 2. januar',
      '/prazniki/praznik-dela/' => 'Praznik dela v Sloveniji obsega 1. in 2. maj.',
      '/prazniki/advent/' => 'Prva adventna nedelja je zato med 27. novembrom in 3. decembrom.'
    }.each do |path, expected|
      page = Page.find_by!(path: path)
      description = PageMetadata.description(page, year: 2027)
      assert_includes description, expected
      refute_match(/\d\.\z/, description)
    end
  end
end
