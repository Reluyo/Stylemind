-- Migration: create_storage_and_helpers

create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql set search_path = public;

create trigger set_updated_at_profiles before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger set_updated_at_clothing before update on public.clothing_items for each row execute procedure public.set_updated_at();
create trigger set_updated_at_outfits before update on public.outfits for each row execute procedure public.set_updated_at();
create trigger set_updated_at_planned before update on public.planned_outfits for each row execute procedure public.set_updated_at();

create view public.outfits_with_items with (security_invoker = true) as
select o.*,
  coalesce(json_agg(json_build_object('id',ci.id,'name',ci.name,'category',ci.category,'color',ci.color,'image_url',ci.image_url,'thumbnail_url',ci.thumbnail_url)) filter (where ci.id is not null),'[]') as items
from public.outfits o
left join public.outfit_items oi on oi.outfit_id = o.id
left join public.clothing_items ci on ci.id = oi.clothing_item_id
group by o.id;

create or replace function public.seed_demo_wardrobe(p_user_id uuid)
returns void as $$
begin
  insert into public.clothing_items (user_id, name, category, color, season, tags) values
    (p_user_id,'White Oxford Shirt','tops','White','{All}','{work,classic}'),
    (p_user_id,'Navy Crew Tee','tops','Navy','{All}','{casual}'),
    (p_user_id,'Camel Knit Sweater','tops','Camel','{Fall,Winter}','{cozy,layering}'),
    (p_user_id,'Floral Blouse','tops','Pink','{Spring}','{feminine,casual}'),
    (p_user_id,'Silk Scarf','tops','Multi','{Fall,Spring}','{accessories,layering}'),
    (p_user_id,'Ribbed Tank Top','tops','Cream','{Summer}','{casual,minimal}'),
    (p_user_id,'Linen Co-ord Top','tops','Sage','{Summer}','{casual,trendy}'),
    (p_user_id,'Tailored Blazer','tops','Charcoal','{Fall,Winter}','{work,formal}'),
    (p_user_id,'Beige Trench Coat','outerwear','Beige','{Spring,Fall}','{classic,layering}'),
    (p_user_id,'Wrap Midi Dress','dresses','Terracotta','{Spring,Summer}','{feminine,casual}'),
    (p_user_id,'Black A-Line Dress','dresses','Black','{All}','{work,versatile}'),
    (p_user_id,'Summer Slip Dress','dresses','Lavender','{Summer}','{casual,feminine}'),
    (p_user_id,'Blazer Dress','dresses','Navy','{Fall}','{work,formal}'),
    (p_user_id,'Dark Wash Jeans','bottoms','Indigo','{All}','{casual,classic}'),
    (p_user_id,'Cream Trousers','bottoms','Cream','{Spring,Summer}','{work,smart}'),
    (p_user_id,'Linen Shorts','bottoms','Sand','{Summer}','{casual,beach}'),
    (p_user_id,'Pleated Skirt','bottoms','Dusty Rose','{Spring}','{feminine,smart}'),
    (p_user_id,'Block Heel Pumps','shoes','Nude','{All}','{work,formal}'),
    (p_user_id,'White Sneakers','shoes','White','{All}','{casual,sporty}'),
    (p_user_id,'Strappy Sandals','shoes','Gold','{Summer}','{dressy,casual}'),
    (p_user_id,'Ankle Boots','shoes','Cognac','{Fall,Winter}','{versatile}'),
    (p_user_id,'Ballet Flats','shoes','Black','{All}','{casual,classic}'),
    (p_user_id,'Gold Necklace','accessories','Gold','{All}','{classic,minimal}'),
    (p_user_id,'Tan Leather Tote','accessories','Tan','{All}','{work,everyday}');
end;
$$ language plpgsql security definer set search_path = public;
